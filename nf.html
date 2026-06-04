<!DOCTYPE html>
<html lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> قیمت لحظه‌ای پالیگان و تتر</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
            background: linear-gradient(135deg, #1e1e2f, #2a2a3b);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;
            padding: 20px;
        }
        .container {
            background: rgba(30, 30, 47, 0.7);
            backdrop-filter: blur(12px);
            border-radius: 32px;
            padding: 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            width: 100%;
            max-width: 500px;
        }
        h1 {
            text-align: center;
            color: #fff;
            font-weight: 600;
            margin-bottom: 30px;
            font-size: 1.8rem;
            background: linear-gradient(90deg, #a855f7, #3b82f6);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
        }
        .price-card {
            background: #0f0f1a;
            border-radius: 24px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid #2a2a3c;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .price-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
            border-color: #3b82f6;
        }
        .token-title {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 15px;
        }
        .token-icon {
            width: 40px;
            height: 40px;
            background: #1e1e2e;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1.2rem;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
        .matic-icon { background: #8247e5; color: white; }
        .usdt-icon { background: #26a17b; color: white; }
        .token-name {
            font-size: 1.4rem;
            font-weight: 600;
            color: #e2e8f0;
        }
        .price {
            font-size: 2.5rem;
            font-weight: 800;
            direction: ltr;
            text-align: left;
            color: #ffffff;
            letter-spacing: 1px;
        }
        .price small {
            font-size: 1rem;
            font-weight: 400;
            color: #94a3b8;
        }
        .last-update {
            text-align: center;
            font-size: 0.75rem;
            color: #64748b;
            margin-top: 20px;
            direction: ltr;
        }
        .loading {
            text-align: center;
            color: #94a3b8;
            padding: 20px;
        }
        .error {
            background: #7f1a1a;
            color: #fecaca;
            padding: 12px;
            border-radius: 16px;
            text-align: center;
            margin-top: 15px;
            font-size: 0.85rem;
        }
        .refresh-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 40px;
            font-size: 0.8rem;
            cursor: pointer;
            display: block;
            margin: 20px auto 0;
            transition: background 0.2s;
        }
        .refresh-btn:hover {
            background: #2563eb;
        }
    </style>
</head>
<body>

<div class="container">
    <h1>💰 قیمت‌های لحظه‌ای</h1>
    
    <div id="matic-card" class="price-card">
        <div class="token-title">
            <div class="token-icon matic-icon">POL</div>
            <div class="token-name">پالیگان (POL)</div>
        </div>
        <div class="price" id="matic-price">--- <small>USD</small></div>
    </div>

    <div id="usdt-card" class="price-card">
        <div class="token-title">
            <div class="token-icon usdt-icon">USDT</div>
            <div class="token-name">تتر (USDT)</div>
        </div>
        <div class="price" id="usdt-price">--- <small>USD</small></div>
    </div>

    <div class="last-update" id="update-time">
        در حال اتصال به شبکه...
    </div>
    <button class="refresh-btn" onclick="fetchPrices()">🔄 بروزرسانی دستی</button>
</div>

<script>
    // آدرس قراردادهای هوشمند در شبکه پالیگان (Polygon)
    // منبع: مستندات 1inch و اطلاعات عمومی بلاکچین
    const TOKENS = {
        matic: {
            // آدرس توکن POL (قبلاً MATIC) در شبکه پالیگان
            // این آدرس برای wrapped version استفاده می‌شود
            address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
            name: "POL"
        },
        usdt: {
            // آدرس توکن USDT در شبکه پالیگان
            // منبع: اکسپلورر پالیگان [citation:8]
            address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
            name: "USDT"
        }
    };

    // API ریلی‌تایم 1inch (کمتر از 300ms پاسخ می‌دهد) [citation:6]
    const ONEINCH_API_URL = "https://api.1inch.dev/price/v1.1/137";

    // تابع اصلی برای دریافت قیمت‌ها
    async function fetchPrices() {
        // نمایش حالت بارگذاری
        document.getElementById("matic-price").innerHTML = "🔄 ... <small>USD</small>";
        document.getElementById("usdt-price").innerHTML = "🔄 ... <small>USD</small>";
        document.getElementById("update-time").innerText = "در حال دریافت قیمت‌ها...";

        try {
            // درخواست همزمان قیمت پالیگان و تتر
            // شبکه 137 = Polygon Mainnet
            const urlMatic = `${ONEINCH_API_URL}/${TOKENS.matic.address}/price?currency=USD`;
            const urlUsdt = `${ONEINCH_API_URL}/${TOKENS.usdt.address}/price?currency=USD`;

            // استفاده از Promise.all برای اجرای همزمان درخواست‌ها
            const [responseMatic, responseUsdt] = await Promise.all([
                fetch(urlMatic),
                fetch(urlUsdt)
            ]);

            // بررسی صحیح بودن پاسخ‌ها
            if (!responseMatic.ok || !responseUsdt.ok) {
                throw new Error(`خطا در دریافت داده از سرور (${responseMatic.status} / ${responseUsdt.status})`);
            }

            // تبدیل پاسخ به JSON
            const dataMatic = await responseMatic.json();
            const dataUsdt = await responseUsdt.json();

            // استخراج قیمت از پاسخ API (قیمت در کلید "price" قرار دارد)
            const maticPrice = dataMatic.price;
            const usdtPrice = dataUsdt.price;

            // اعتبارسنجی عدد بودن قیمت‌ها
            if (!maticPrice || typeof maticPrice !== 'number' || maticPrice <= 0) {
                throw new Error("قیمت دریافت شده برای پالیگان معتبر نیست");
            }
            if (!usdtPrice || typeof usdtPrice !== 'number' || usdtPrice <= 0) {
                throw new Error("قیمت دریافت شده برای تتر معتبر نیست");
            }

            // نمایش قیمت‌ها با فرمت مناسب
            // قیمت تتر معمولاً باید نزدیک 1 دلار باشد
            document.getElementById("matic-price").innerHTML = `${formatPrice(maticPrice)} <small>USD</small>`;
            document.getElementById("usdt-price").innerHTML = `${formatPrice(usdtPrice)} <small>USD</small>`;
            
            // ثبت زمان آخرین بروزرسانی
            const now = new Date();
            const timeString = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            document.getElementById("update-time").innerHTML = `✅ آخرین بروزرسانی: ${timeString} (لحظه‌ای)`;

        } catch (error) {
            console.error("خطا در دریافت قیمت:", error);
            
            // نمایش خطا به کاربر
            document.getElementById("matic-price").innerHTML = "❌ خطا <small>USD</small>";
            document.getElementById("usdt-price").innerHTML = "❌ خطا <small>USD</small>";
            document.getElementById("update-time").innerHTML = `⚠️ اتصال ناموفق: ${error.message}. لطفاً صفحه را دوباره بارگذاری کنید.`;
        }
    }

    // تابع کمکی برای فرمت کردن اعداد (مخصوص ارزهای دیجیتال)
    function formatPrice(price) {
        if (price < 0.01) {
            return price.toFixed(6); // برای قیمت‌های خیلی کوچک
        }
        if (price < 1) {
            return price.toFixed(4);
        }
        // جدا کننده هزارگان برای قیمت‌های بزرگتر
        return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }

    // دریافت خودکار قیمت در هنگام بارگذاری صفحه
    fetchPrices();

    // تنظیم تایمر برای بروزرسانی خودکار هر 15 ثانیه (لحظه‌ای)
    // می‌توانید این عدد را به 10 یا 30 ثانیه تغییر دهید
    setInterval(fetchPrices, 15000);

    // توضیحات اضافی برای کنسول
    console.log("✅ نمایشگر قیمت پالیگان و تتر راه‌اندازی شد.");
    console.log("🔗 استفاده از API اسپات قیمت 1inch روی شبکه پالیگان (137)");
</script>
</body>
</html>
