// استعادة البيانات أو إنشاء مصفوفات فارغة
let employees = JSON.parse(localStorage.getItem('nado_v4_emps')) || [];
let logs = JSON.parse(localStorage.getItem('nado_v4_logs')) || [];
let expenses = JSON.parse(localStorage.getItem('nado_v4_exps')) || [];
let companyLogo = localStorage.getItem('nado_v4_logo') || "";

// التعامل مع رفع الشعار وحفظه في الذاكرة
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            companyLogo = e.target.result;
            localStorage.setItem('nado_v4_logo', companyLogo);
            alert("تم حفظ الشعار في ذاكرة النظام بنجاح! ✅");
        };
        reader.readAsDataURL(file);
    }
}

// دالة توليد رأس التقرير (الشعار + العنوان)
function getReportHeader(title) {
    let logoHtml = companyLogo ? `<img src="${companyLogo}" style="max-height: 100px; margin-bottom: 10px;">` : `<h1 style="color:#00d4ff">NADO LIBYA</h1>`;
    return `
        <div style="text-align:center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
            ${logoHtml}
            <h2>${getReportTitle(title)}</h2>
            <p>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-LY')}</p>
        </div>
    `;
}

// التنقل بين الأقسام
function openTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    event.currentTarget.classList.add('active');
    if(id === 'home') updateStats();
    if(id === 'expenses') renderExpenseTable();
    if(id === 'reports') updateDropdowns();
}

// خوارزمية حساب الساعة (راتب / 180)
function autoCalcRate() {
    let salary = document.getElementById('empSalary').value;
    document.getElementById('hRate').value = (salary / 180).toFixed(2);
}

// حفظ موظف
function saveEmployee() {
    let emp = {
        id: Date.now(),
        name: document.getElementById('empName').value,
        job: document.getElementById('empJob').value,
        salary: parseFloat(document.getElementById('empSalary').value)
    };
    if(!emp.name || !emp.salary) return alert("يرجى ملء البيانات الأساسية!");
    employees.push(emp);
    localStorage.setItem('nado_v4_emps', JSON.stringify(employees));
    updateDropdowns();
    alert("تم الحفظ بنجاح! ✅");
}

// تسجيل غياب/خصم
function saveActionLog() {
    let log = {
        id: Date.now(),
        empId: document.getElementById('empSelectAction').value,
        date: document.getElementById('actDate').value,
        reason: document.getElementById('actReason').value,
        amount: parseFloat(document.getElementById('actAmount').value) || 0
    };
    logs.push(log);
    localStorage.setItem('nado_v4_logs', JSON.stringify(logs));
    alert("تم تسجيل الحركة! 📉");
}

// حفظ مصروف
function saveExpense() {
    let exp = {
        id: Date.now(),
        item: document.getElementById('expItem').value,
        price: parseFloat(document.getElementById('expPrice').value),
        date: document.getElementById('expDate').value
    };
    expenses.push(exp);
    localStorage.setItem('nado_v4_exps', JSON.stringify(expenses));
    renderExpenseTable();
    alert("تم إضافة المصروف! ✅");
}

// حذف مصروف
function deleteExpense(id) {
    if(confirm("هل أنت متأكد من حذف هذا البند؟")) {
        expenses = expenses.filter(x => x.id !== id);
        localStorage.setItem('nado_v4_exps', JSON.stringify(expenses));
        renderExpenseTable();
    }
}

// تحديث جدول المصروفات التفاعلي
function renderExpenseTable() {
    let html = `<table class="interactive-table">
                <thead><tr><th>البيان</th><th>التاريخ</th><th>القيمة</th><th>تحكم</th></tr></thead><tbody>`;
    expenses.forEach(x => {
        html += `<tr><td>${x.item}</td><td>${x.date}</td><td>${x.price} د.ل</td>
                 <td><button class="btn-del" onclick="deleteExpense(${x.id})">حذف 🗑️</button></td></tr>`;
    });
    html += `</tbody></table>`;
    document.getElementById('expense-table-container').innerHTML = html;
}

// تحديث الإحصائيات في الصفحة الرئيسية
function updateStats() {
    let totalExp = expenses.reduce((s, x) => s + x.price, 0);
    let totalNetSal = 0;
    employees.forEach(e => {
        let eLogs = logs.filter(l => l.empId == e.id);
        let disc = eLogs.reduce((s, l) => s + l.amount, 0);
        totalNetSal += (e.salary - disc);
    });
    document.getElementById('total-salaries-view').innerText = totalNetSal.toFixed(2) + " د.ل";
    document.getElementById('total-expenses-view').innerText = totalExp.toFixed(2) + " د.ل";
}

// القوائم المنسدلة
function updateDropdowns() {
    let opt = employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
    document.getElementById('empSelectAction').innerHTML = opt;
    document.getElementById('empSelectReport').innerHTML = opt;
}

// خوارزمية عنوان التقرير (اسم الشهر)
function getReportTitle(baseTitle) {
    let monthInput = document.getElementById('reportMonthSelect').value;
    if(!monthInput) return baseTitle;
    let [year, month] = monthInput.split('-');
    const monthsAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    return `${baseTitle} لشهر ${monthsAr[parseInt(month)-1]} ${year}`;
}

// تقرير الموظفين الشامل
function genFullEmpReport() {
    let header = getReportHeader("التقرير العام للرواتب");
    let html = header;
    let grandTotal = 0;

    employees.forEach(e => {
        let eLogs = logs.filter(l => l.empId == e.id);
        let disc = eLogs.reduce((s, l) => s + l.amount, 0);
        let net = e.salary - disc;
        grandTotal += net;
        html += `<div style="margin-bottom:15px; border-bottom:1px solid #eee; padding:10px;">
                    <h3 style="margin:0">${e.name}</h3>
                    <small>${e.job}</small>
                    <p>الراتب الأساسي: ${e.salary} د.ل | الخصومات: ${disc} د.ل | <b>الصافي: ${net} د.ل</b></p>
                 </div>`;
    });
    html += `<div style="margin-top:20px; background:#f0f0f0; padding:15px; text-align:center; border: 2px solid #000;">
                <h2>إجمالي الرواتب الكلي: ${grandTotal.toFixed(2)} د.ل</h2>
             </div>`;
    document.getElementById('report-paper').innerHTML = html;
}

// تقرير مصروفات الشهر
function genFullExpReport() {
    let header = getReportHeader("تقرير المصروفات والمشتريات");
    let total = expenses.reduce((s, x) => s + x.price, 0);
    let html = header + `<table><thead><tr><th>البيان</th><th>التاريخ</th><th>القيمة</th></tr></thead><tbody>`;
    expenses.forEach(x => html += `<tr><td>${x.item}</td><td>${x.date}</td><td>${x.price} د.ل</td></tr>`);
    html += `</tbody></table><h3 style="text-align:left; margin-top:20px;">إجمالي المصروفات: ${total.toFixed(2)} د.ل</h3>`;
    document.getElementById('report-paper').innerHTML = html;
}

// تقرير موظف محدد
function genIndividualReport() {
    let id = document.getElementById('empSelectReport').value;
    let e = employees.find(x => x.id == id);
    if(!e) return alert("اختر موظفاً أولاً");

    let header = getReportHeader(`سجل مستحقات: ${e.name}`);
    let eLogs = logs.filter(l => l.empId == id);
    let disc = eLogs.reduce((s, l) => s + l.amount, 0);

    let html = header + `
                <div style="background:#f9f9f9; padding:10px; border-radius:5px; margin-bottom:20px;">
                    <p><b>المسمى الوظيفي:</b> ${e.job}</p>
                    <p><b>الراتب الأساسي:</b> ${e.salary} د.ل</p>
                </div>
                <table><thead><tr><th>التاريخ</th><th>السبب</th><th>القيمة المخصومة</th></tr></thead><tbody>`;
    eLogs.forEach(l => html += `<tr><td>${l.date}</td><td>${l.reason}</td><td>${l.amount} د.ل</td></tr>`);
    html += `</tbody></table>
             <div style="text-align:left; margin-top:30px;">
                <h2 style="color:#d9534f; border-bottom:2px solid #d9534f; display:inline-block;">صافي المستحق: ${e.salary - disc} د.ل</h2>
             </div>`;
    document.getElementById('report-paper').innerHTML = html;
}

function printToPDF() {
    const el = document.getElementById('report-paper');
    const opt = {
        margin:       10,
        filename:     'Nado_Libya_Report.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(el).save();
}

// تشغيل عند البداية
updateDropdowns();
updateStats();