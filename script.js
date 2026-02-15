// script.js
class TokenCreator {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.contractAddress = "0xYourContractAddressHere"; // آدرس قرارداد شما
        this.abi = []; // ABI قرارداد را از فایل abi.json بارگذاری کنید
        
        this.init();
    }
    
    async init() {
        this.initializeElements();
        this.attachEventListeners();
        await this.checkWalletConnection();
        this.loadABI();
    }
    
    initializeElements() {
        // المان‌های DOM
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
        
        // المان‌های نتایج
        this.resultName = document.getElementById('resultName');
        this.resultSymbol = document.getElementById('resultSymbol');
        this.resultAddress = document.getElementById('resultAddress');
        this.polygonScanLink = document.getElementById('polygonScanLink');
        
        // گزینه‌های پیشرفته
        this.toggleAdvanced = document.getElementById('toggleAdvanced');
        this.advancedPanel = document.getElementById('advancedPanel');
    }
    
    attachEventListeners() {
        this.connectBtn.addEventListener('click', () => this.connectWallet());
        this.tokenForm.addEventListener('submit', (e) => this.handleCreateToken(e));
        this.toggleAdvanced.addEventListener('click', () => this.toggleAdvancedOptions());
        
        document.getElementById('copyAddress').addEventListener('click', () => this.copyAddress());
        document.getElementById('createAnother').addEventListener('click', () => this.resetForm());
        
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
            // ABI قرارداد خود را از فایل جداگانه بارگذاری کنید
            const response = await fetch('abi.json');
            this.abi = await response.json();
        } catch (error) {
            console.log('خطا در بارگذاری ABI:', error);
        }
    }
    
    async checkWalletConnection() {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    await this.connectWallet();
                }
            } catch (error) {
                console.log('خطا در بررسی کیف پول:', error);
            }
        }
    }
    
    async connectWallet() {
        if (!window.ethereum) {
            alert('لطفاً MetaMask را نصب کنید!');
            window.open('https://metamask.io/download.html', '_blank');
            return;
        }
        
        try {
            // درخواست اتصال کیف پول
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            this.account = accounts[0];
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            
            // بررسی شبکه
            await this.checkNetwork();
            
            // بروزرسانی UI
            this.updateUIForConnected();
            
            // گوش دادن به تغییرات
            this.setupEventListeners();
            
        } catch (error) {
            console.error('خطا در اتصال کیف پول:', error);
            alert('خطا در اتصال کیف پول: ' + error.message);
        }
    }
    
    async checkNetwork() {
        const network = await this.provider.getNetwork();
        const chainId = Number(network.chainId);
        
        // Polygon Mainnet: 137, Mumbai Testnet: 80001
        if (chainId !== 137 && chainId !== 80001) {
            const wantsToSwitch = confirm('لطفاً به شبکه پالیگان سوئیچ کنید. آیا می‌خواهید الآن سوئیچ کنید؟');
            
            if (wantsToSwitch) {
                await this.switchToPolygon();
            }
        } else {
            this.networkIndicator.classList.add('connected');
            this.networkName.textContent = chainId === 137 ? 'Polygon Mainnet' : 'Polygon Mumbai';
        }
    }
    
    async switchToPolygon() {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0x89', // 137 in hex
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
        this.connectBtnText.textContent = this.account.slice(0, 6) + '...' + this.account.slice(-4);
        this.createBtn.disabled = false;
    }
    
    setupEventListeners() {
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
    
    disconnectWallet() {
        this.account = null;
        this.signer = null;
        this.connectBtn.classList.remove('connected');
        this.connectBtnText.textContent = 'اتصال کیف پول';
        this.createBtn.disabled = true;
        this.networkIndicator.classList.remove('connected');
        this.networkName.textContent = 'پالیگان';
    }
    
    async handleCreateToken(e) {
        e.preventDefault();
        
        // دریافت مقادیر فرم
        const name = document.getElementById('tokenName').value;
        const symbol = document.getElementById('tokenSymbol').value;
        const supply = document.getElementById('totalSupply').value;
        const decimals = document.getElementById('decimals').value;
        
        if (!name || !symbol || !supply) {
            alert('لطفاً همه فیلدها را پر کنید!');
            return;
        }
        
        // نمایش کارت تراکنش
        this.transactionCard.style.display = 'block';
        this.resultCard.style.display = 'none';
        this.progressFill.style.width = '30%';
        this.transactionMessage.textContent = 'در حال آماده‌سازی تراکنش...';
        
        try {
            // محاسبه عرضه با اعشار
            const totalSupply = ethers.parseUnits(supply, decimals);
            
            // اینجا باید تابع ساخت توکن را فراخوانی کنید
            // بستگی به قرارداد شما دارد که چطور توکن بسازد
            
            // مثال: اگر قرارداد شما تابع createToken دارد
            // const contract = new ethers.Contract(this.contractAddress, this.abi, this.signer);
            // const tx = await contract.createToken(name, symbol, totalSupply, decimals);
            
            // شبیه‌سازی تراکنش (برای تست)
            await this.simulateTransaction(name, symbol, supply);
            
        } catch (error) {
            console.error('خطا در ساخت توکن:', error);
            this.transactionMessage.textContent = 'خطا در ساخت توکن: ' + error.message;
            this.progressFill.style.width = '0%';
        }
    }
    
    async simulateTransaction(name, symbol, supply) {
        // این تابع فقط برای شبیه‌سازی است
        // در پروژه واقعی، اینجا تراکنش واقعی اجرا می‌شود
        
        this.transactionMessage.textContent = 'در حال تایید در کیف پول...';
        this.progressFill.style.width = '60%';
        
        // شبیه‌سازی تاخیر
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        this.transactionMessage.textContent = 'در حال پردازش روی بلاکچین...';
        this.progressFill.style.width = '90%';
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // نمایش نتیجه
        this.progressFill.style.width = '100%';
        this.transactionMessage.textContent = 'تراکنش با موفقیت انجام شد!';
        
        // آدرس قرارداد شبیه‌سازی شده
        const mockContractAddress = '0x' + Math.random().toString(16).substring(2, 42);
        
        this.showResult(name, symbol, mockContractAddress);
    }
    
    showResult(name, symbol, contractAddress) {
        this.transactionCard.style.display = 'none';
        this.resultCard.style.display = 'block';
        
        this.resultName.textContent = name;
        this.resultSymbol.textContent = symbol;
        this.resultAddress.textContent = contractAddress;
        
        // لینک پالیگان‌اسکن
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
