// script.js - نسخه سازگار با موبایل
class TokenCreator {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.sdk = null; // برای MetaMask SDK
        this.contractAddress = "0xYourContractAddressHere"; // آدرس قراردادت رو بذار
        this.abi = []; // ABI قرارداد
        
        this.init();
    }
    
    async init() {
        this.initializeElements();
        this.attachEventListeners();
        await this.checkWalletConnection();
        this.loadABI();
        // بارگذاری MetaMask SDK
        this.loadMetaMaskSDK();
    }
    
    loadMetaMaskSDK() {
        // بارگذاری اسکریپت MetaMask SDK
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@metamask/sdk@0.20.3/dist/browser/umd/index.js';
        script.onload = () => this.initializeMetaMaskSDK();
        document.head.appendChild(script);
    }
    
    async initializeMetaMaskSDK() {
        if (window.MetaMaskSDK) {
            try {
                const MMSDK = window.MetaMaskSDK.MetaMaskSDK;
                this.sdk = new MMSDK({
                    dappMetadata: {
                        name: "توکن‌ساز پالیگان",
                        url: window.location.href,
                    },
                    // این گزینه برای موبایل خیلی مهمه
                    checkInstallationImmediately: false,
                    preferDesktop: false,
                    // ذخیره‌سازی وضعیت اتصال
                    storage: {
                        enabled: true,
                    },
                });
                
                console.log("MetaMask SDK initialized");
            } catch (error) {
                console.error("Error initializing MetaMask SDK:", error);
            }
        }
    }
    
    initializeElements() {
        // المان‌های DOM - مثل قبل
        this.connectBtn = document.getElementById('connectWallet');
        this.connectBtnText = this.connectBtn.querySelector('span');
        this.networkIndicator = document.getElementById('networkIndicator');
        this.networkName = document.getElementById('networkName');
        this.tokenForm = document.getElementById('tokenForm');
        this.createBtn = document.getElementById('createToken');
        this.transactionCard = document.getElementById('transactionCard');
        this.resultCard = document.getElementById('resultCard');
        this.progressFill = document.getElementById('progressFill');
        this.transactionMessage = document.getElementById('transactionMessage');
        this.transactionHash = document.getElementById('transactionHash');
        
        this.resultName = document.getElementById('resultName');
        this.resultSymbol = document.getElementById('resultSymbol');
        this.resultAddress = document.getElementById('resultAddress');
        this.polygonScanLink = document.getElementById('polygonScanLink');
        
        this.toggleAdvanced = document.getElementById('toggleAdvanced');
        this.advancedPanel = document.getElementById('advancedPanel');
    }
    
    attachEventListeners() {
        this.connectBtn.addEventListener('click', () => this.connectWallet());
        this.tokenForm.addEventListener('submit', (e) => this.handleCreateToken(e));
        this.toggleAdvanced.addEventListener('click', () => this.toggleAdvancedOptions());
        
        document.getElementById('copyAddress')?.addEventListener('click', () => this.copyAddress());
        document.getElementById('createAnother')?.addEventListener('click', () => this.resetForm());
        
        // FAQ accordion
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const item = question.parentElement;
                item.classList.toggle('active');
            });
        });
    }
    
    async loadABI() {
        try {
            const response = await fetch('abi.json');
            if (response.ok) {
                this.abi = await response.json();
            }
        } catch (error) {
            console.log('خطا در بارگذاری ABI:', error);
        }
    }
    
    async checkWalletConnection() {
        // بررسی اتصال قبلی
        if (window.ethereum && window.ethereum.selectedAddress) {
            try {
                this.account = window.ethereum.selectedAddress;
                this.provider = new ethers.BrowserProvider(window.ethereum);
                this.signer = await this.provider.getSigner();
                await this.checkNetwork();
                this.updateUIForConnected();
            } catch (error) {
                console.log('خطا در بررسی کیف پول:', error);
            }
        }
    }
    
    async connectWallet() {
        // تشخیص محیط موبایل یا دسکتاپ
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        try {
            if (isMobile && this.sdk) {
                // روش موبایل: استفاده از MetaMask SDK برای deep linking
                await this.connectMobile();
            } else {
                // روش دسکتاپ: استفاده از ethereum provider
                await this.connectDesktop();
            }
        } catch (error) {
            console.error('خطا در اتصال کیف پول:', error);
            alert('خطا در اتصال کیف پول: ' + error.message);
        }
    }
    
    async connectMobile() {
        try {
            // استفاده از MetaMask SDK برای اتصال موبایل
            const accounts = await this.sdk.connect();
            
            if (accounts && accounts[0]) {
                this.account = accounts[0];
                
                // دریافت provider از SDK
                const provider = this.sdk.getProvider();
                this.provider = new ethers.BrowserProvider(provider);
                this.signer = await this.provider.getSigner();
                
                await this.checkNetwork();
                this.updateUIForConnected();
                
                // ذخیره وضعیت اتصال
                localStorage.setItem('walletConnected', 'true');
                localStorage.setItem('walletAddress', this.account);
            }
        } catch (error) {
            console.error('Mobile connection error:', error);
            // اگر SDK کار نکرد، از روش جایگزین استفاده کن
            await this.connectWithWalletConnect();
        }
    }
    
    async connectWithWalletConnect() {
        // روش جایگزین برای موبایل: استفاده از WalletConnect
        try {
            // نمایش QR کد یا راهنمایی برای اتصال
            alert('لطفاً روی آیکون متامسک در مرورگر گوشی کلیک کنید یا از WalletConnect استفاده کنید.');
            
            // استفاده از WalletConnect (نیاز به نصب کتابخانه)
            const WalletConnectProvider = window.WalletConnectProvider?.default;
            if (WalletConnectProvider) {
                const provider = new WalletConnectProvider({
                    rpc: {
                        137: 'https://polygon-rpc.com',
                        80001: 'https://rpc-mumbai.maticvigil.com'
                    },
                    chainId: 137
                });
                
                await provider.enable();
                this.provider = new ethers.BrowserProvider(provider);
                this.signer = await this.provider.getSigner();
                this.account = await this.signer.getAddress();
                
                await this.checkNetwork();
                this.updateUIForConnected();
            }
        } catch (error) {
            console.error('WalletConnect error:', error);
            alert('لطفاً مطمئن شوید متامسک روی گوشی نصب است و دوباره تلاش کنید.');
        }
    }
    
    async connectDesktop() {
        // روش دسکتاپ - مثل قبل
        if (!window.ethereum) {
            alert('لطفاً MetaMask را نصب کنید!');
            window.open('https://metamask.io/download.html', '_blank');
            return;
        }
        
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        this.account = accounts[0];
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        
        await this.checkNetwork();
        this.updateUIForConnected();
        
        // ذخیره وضعیت
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', this.account);
        
        this.setupEventListeners();
    }
    
    async checkNetwork() {
        if (!this.provider) return;
        
        try {
            const network = await this.provider.getNetwork();
            const chainId = Number(network.chainId);
            
            if (chainId !== 137 && chainId !== 80001) {
                const wantsToSwitch = confirm('لطفاً به شبکه پالیگان سوئیچ کنید. آیا می‌خواهید الآن سوئیچ کنید؟');
                
                if (wantsToSwitch) {
                    await this.switchToPolygon();
                }
            } else {
                this.networkIndicator.classList.add('connected');
                this.networkName.textContent = chainId === 137 ? 'Polygon Mainnet' : 'Polygon Mumbai';
            }
        } catch (error) {
            console.error('Network check error:', error);
        }
    }
    
    async switchToPolygon() {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0x89',
                    chainName: 'Polygon Mainnet',
                    nativeCurrency: {
                        name: 'MATIC',
                        symbol: 'POL',
                        decimals: 18
                    },
                    rpcUrls: ['https://polygon-rpc.com/'],
                    blockExplorerUrls: ['https://polygonscan.com/']
                }]
            });
        } catch (error) {
            console.error('خطا در تغییر شبکه:', error);
        }
    }
    
    updateUIForConnected() {
        this.connectBtn.classList.add('connected');
        const shortAddress = this.account.slice(0, 6) + '...' + this.account.slice(-4);
        this.connectBtnText.textContent = shortAddress;
        this.createBtn.disabled = false;
    }
    
    setupEventListeners() {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnectWallet();
                } else {
                    this.account = accounts[0];
                    this.updateUIForConnected();
                }
            });
            
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
    }
    
    disconnectWallet() {
        this.account = null;
        this.signer = null;
        this.connectBtn.classList.remove('connected');
        this.connectBtnText.textContent = 'اتصال کیف پول';
        this.createBtn.disabled = true;
        this.networkIndicator.classList.remove('connected');
        this.networkName.textContent = 'پالیگان';
        
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletAddress');
    }
    
    async handleCreateToken(e) {
        e.preventDefault();
        
        const name = document.getElementById('tokenName').value;
        const symbol = document.getElementById('tokenSymbol').value;
        const supply = document.getElementById('totalSupply').value;
        const decimals = document.getElementById('decimals').value;
        
        if (!name || !symbol || !supply) {
            alert('لطفاً همه فیلدها را پر کنید!');
            return;
        }
        
        this.transactionCard.style.display = 'block';
        this.resultCard.style.display = 'none';
        this.progressFill.style.width = '30%';
        this.transactionMessage.textContent = 'در حال آماده‌سازی تراکنش...';
        
        try {
            const totalSupply = ethers.parseUnits(supply, decimals);
            
            // اینجا تابع ساخت توکن را فراخوانی کن
            // بستگی به قراردادت داره
            
            // برای تست:
            await this.simulateTransaction(name, symbol, supply);
            
        } catch (error) {
            console.error('خطا در ساخت توکن:', error);
            this.transactionMessage.textContent = 'خطا در ساخت توکن: ' + error.message;
            this.progressFill.style.width = '0%';
        }
    }
    
    async simulateTransaction(name, symbol, supply) {
        this.transactionMessage.textContent = 'در حال تایید در کیف پول...';
        this.progressFill.style.width = '60%';
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        this.transactionMessage.textContent = 'در حال پردازش روی بلاکچین...';
        this.progressFill.style.width = '90%';
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        this.progressFill.style.width = '100%';
        this.transactionMessage.textContent = 'تراکنش با موفقیت انجام شد!';
        
        const mockContractAddress = '0x' + Math.random().toString(16).substring(2, 42);
        this.showResult(name, symbol, mockContractAddress);
    }
    
    showResult(name, symbol, contractAddress) {
        this.transactionCard.style.display = 'none';
        this.resultCard.style.display = 'block';
        
        this.resultName.textContent = name;
        this.resultSymbol.textContent = symbol;
        this.resultAddress.textContent = contractAddress;
        
        this.polygonScanLink.href = `https://polygonscan.com/address/${contractAddress}`;
    }
    
    toggleAdvancedOptions() {
        this.advancedPanel.classList.toggle('hidden');
        const icon = this.toggleAdvanced.querySelector('i');
        icon.style.transform = this.advancedPanel.classList.contains('hidden') 
            ? 'rotate(0deg)' 
            : 'rotate(180deg)';
    }
    
    async copyAddress() {
        const address = this.resultAddress.textContent;
        try {
            await navigator.clipboard.writeText(address);
            alert('آدرس کپی شد!');
        } catch (err) {
            console.error('خطا در کپی:', err);
        }
    }
    
    resetForm() {
        this.tokenForm.reset();
        this.resultCard.style.display = 'none';
        this.transactionCard.style.display = 'none';
        this.progressFill.style.width = '0%';
    }
}

// راه‌اندازی برنامه
document.addEventListener('DOMContentLoaded', () => {
    new TokenCreator();
});
