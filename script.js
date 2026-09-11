document.addEventListener('DOMContentLoaded', () => {
    const API_URL = "https://script.google.com/macros/s/AKfycbyQ31v8x2T991tI8Ka05Ul9GpXCKiot5mblanVU5P6H6yWblr0_DIpmULlNuAhudAly/exec";

    const landingPage = document.getElementById('landing-page');
    const authPage = document.getElementById('auth-page');
    const mainApp = document.getElementById('main-app');

    const btnToLogin = document.getElementById('btn-to-login');
    const btnStart = document.getElementById('btn-start');
    const backToLanding = document.getElementById('back-to-landing');

    const toggleAuthMode = document.getElementById('toggle-auth-mode');
    const registerFields = document.getElementById('register-fields');
    const btnAuthSubmit = document.getElementById('btn-auth-submit');
    const btnGoogleLogin = document.getElementById('btn-google-login');
    const menuLogout = document.getElementById('menu-logout');

    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    const fabAdd = document.getElementById('fab-add');
    const expenseModal = document.getElementById('expense-modal');
    const overlay = document.getElementById('modal-overlay');
    const btnSaveExpense = document.getElementById('btn-save-expense');
    const catItems = document.querySelectorAll('.cat-item');

    const calDays = document.querySelectorAll('.cal-day');
    const selectedDateLabel = document.getElementById('selected-date-label');
    const dailyTxList = document.getElementById('daily-transaction-list');

    let isRegisterMode = false;
    let globalReportData = { daily_transactions: {} };
    let selectedDateKey = "2026-09-10"; // Default tanggal uji coba aktif

    const initApp = () => {
        const userId = localStorage.getItem("user_id");
        if (userId) {
            landingPage.classList.remove('active', 'hidden');
            landingPage.classList.add('hidden');
            authPage.classList.remove('active', 'hidden');
            authPage.classList.add('hidden');
            mainApp.classList.remove('hidden');
            mainApp.classList.add('active');
            fetchDashboardData();
        } else {
            landingPage.classList.remove('hidden');
            landingPage.classList.add('active');
            authPage.classList.remove('active', 'hidden');
            authPage.classList.add('hidden');
            mainApp.classList.remove('active', 'hidden');
            mainApp.classList.add('hidden');
        }
    };
    initApp();

    if (btnToLogin) {
        btnToLogin.addEventListener('click', () => {
            landingPage.classList.remove('active'); landingPage.classList.add('hidden');
            authPage.classList.remove('hidden'); authPage.classList.add('active');
        });
    }

    if (backToLanding) {
        backToLanding.addEventListener('click', () => {
            authPage.classList.remove('active'); authPage.classList.add('hidden');
            landingPage.classList.remove('hidden'); landingPage.classList.add('active');
        });
    }

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            localStorage.setItem("user_id", "USR_GUEST");
            localStorage.setItem("user_name", "Guest");
            landingPage.classList.remove('active'); landingPage.classList.add('hidden');
            mainApp.classList.remove('hidden'); mainApp.classList.add('active');
            fetchDashboardData();
        });
    }

    if (menuLogout) {
        menuLogout.addEventListener('click', () => {
            localStorage.clear();
            initApp();
        });
    }

    if (toggleAuthMode) {
        toggleAuthMode.addEventListener('click', () => {
            isRegisterMode = !isRegisterMode;
            if (isRegisterMode) {
                registerFields.classList.remove('hidden');
                btnAuthSubmit.textContent = 'Daftar Akun';
                toggleAuthMode.innerHTML = 'Sudah punya akun? <span class="accent-blue">Masuk</span>';
            } else {
                registerFields.classList.add('hidden');
                btnAuthSubmit.textContent = 'Masuk';
                toggleAuthMode.innerHTML = 'Belum punya akun? <span class="accent-blue">Daftar sekarang</span>';
            }
        });
    }

    if (btnAuthSubmit) {
        btnAuthSubmit.addEventListener('click', async () => {
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
            const name = isRegisterMode ? document.getElementById('reg-name').value : "";

            if (!email || !password) { alert("Email dan password wajib diisi!"); return; }

            const action = isRegisterMode ? "register" : "login";
            try {
                btnAuthSubmit.textContent = "Memproses...";
                const response = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ action, email, password, name })
                });
                const result = await response.json();

                if (result.status === "success") {
                    localStorage.setItem("user_id", result.user_id);
                    localStorage.setItem("user_name", result.name || name || "Muz");
                    authPage.classList.remove('active'); authPage.classList.add('hidden');
                    mainApp.classList.remove('hidden'); mainApp.classList.add('active');
                    fetchDashboardData();
                } else {
                    alert(result.message || "Autentikasi gagal!");
                }
            } catch (error) {
                console.error("Auth Error:", error);
                alert("Koneksi ke server gagal.");
            } finally {
                btnAuthSubmit.textContent = isRegisterMode ? 'Daftar Akun' : 'Masuk';
            }
        });
    }

    // --- Ambil Data Kalkulasi & Laporan dari Backend ---
    async function fetchDashboardData() {
        const userId = localStorage.getItem("user_id");
        if (!userId) return;

        try {
            const response = await fetch(`${API_URL}?action=get_report&user_id=${userId}`);
            const result = await response.json();

            if (result.status === "success") {
                // Update UI Dashboard Utama
                document.getElementById('display-daily-budget').textContent = `Rp ${result.daily_budget.toLocaleString('id-ID')}`;
                document.getElementById('display-total-expense').textContent = `Rp ${result.total_expense.toLocaleString('id-ID')}`;
                document.getElementById('display-total-balance').textContent = `Rp ${result.total_balance.toLocaleString('id-ID')}`;

                globalReportData = result;
                renderTransactionsForDate(selectedDateKey);
            }
        } catch (error) {
            console.error("Error fetching report:", error);
        }
    }

    // --- Render Transaksi ke Riwayat Berdasarkan Tanggal yang Dipilih ---
    function renderTransactionsForDate(dateKey) {
        const txs = globalReportData.daily_transactions[dateKey] || [];
        selectedDateLabel.textContent = `${dateKey}`;

        if (txs.length === 0) {
            dailyTxList.innerHTML = `<div class="glass-panel" style="padding: 24px; text-align: center;"><p class="text-muted text-sm">Belum ada transaksi di tanggal ini.</p></div>`;
            return;
        }

        let html = '';
        txs.forEach(tx => {
            html += `
                <div class="glass-panel" style="padding: 14px 18px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="display: block; font-size: 14px; color: var(--text-main);">${tx.category}</strong>
                        <span style="font-size: 12px; color: var(--text-muted);">${tx.note || 'Tanpa catatan'}</span>
                    </div>
                    <span style="font-weight: 700; color: #e74c3c;">- Rp ${tx.amount.toLocaleString('id-ID')}</span>
                </div>
            `;
        });
        dailyTxList.innerHTML = html;
    }

    // --- Navigasi Tab ---
    navItems.forEach(nav => {
        nav.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = nav.getAttribute('data-target');
            navItems.forEach(n => n.classList.remove('active'));
            nav.classList.add('active');

            tabContents.forEach(tab => { tab.classList.add('hidden'); tab.classList.remove('active'); });
            const activeTab = document.getElementById(`tab-${targetId}`);
            if (activeTab) {
                activeTab.classList.remove('hidden');
                void activeTab.offsetWidth;
                activeTab.classList.add('active');
                if (targetId === 'report' || targetId === 'home') {
                    fetchDashboardData();
                }
            }
        });
    });

    // --- Interaksi Klik Kalender ---
    calDays.forEach(day => {
        day.addEventListener('click', () => {
            if (day.classList.contains('other-month')) return;
            calDays.forEach(d => d.classList.remove('active-date'));
            day.classList.add('active-date');
            
            const dayNum = day.getAttribute('data-date').padStart(2, '0');
            selectedDateKey = `2026-09-${dayNum}`;
            renderTransactionsForDate(selectedDateKey);
        });
    });

    // --- Modal Pengeluaran ---
    const openModal = () => { overlay.classList.add('active'); expenseModal.classList.add('active'); };
    const closeModal = () => { overlay.classList.remove('active'); expenseModal.classList.remove('active'); };
    if (fabAdd) fabAdd.addEventListener('click', openModal);
    if (overlay) overlay.addEventListener('click', closeModal);

    catItems.forEach(item => {
        item.addEventListener('click', () => {
            catItems.forEach(c => c.classList.remove('active'));
            item.classList.add('active');
            selectedCategory = item.textContent.trim().replace(/[^a-zA-Z]/g, "");
        });
    });
    let selectedCategory = "Makan";

    // --- Simpan Pengeluaran & Refresh Otomatis ---
    if (btnSaveExpense) {
        btnSaveExpense.addEventListener('click', async () => {
            const amount = document.getElementById('expense-amount').value;
            const note = document.getElementById('expense-note').value;
            const userId = localStorage.getItem("user_id");

            if (!amount) { alert("Masukkan nominal pengeluaran!"); return; }

            const payload = {
                action: "add_expense",
                user_id: userId,
                amount: parseFloat(amount),
                category: selectedCategory,
                note: note,
                date: selectedDateKey // Sesuai tanggal kalender yang aktif diklik
            };

            try {
                btnSaveExpense.textContent = "Menyimpan...";
                const response = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();

                if (result.status === "success") {
                    closeModal();
                    document.getElementById('expense-amount').value = "";
                    document.getElementById('expense-note').value = "";
                    alert(result.message);
                    fetchDashboardData(); // Refresh otomatis kalkulasi & kalender
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error("Error Expense:", error);
                alert("Koneksi ke backend gagal.");
            } finally {
                btnSaveExpense.textContent = "Simpan";
            }
        });
    }

    // --- Navigasi Sub-View (Setup Gaji & Alokasi) ---
    const showSubView = (subViewId) => {
        tabContents.forEach(tab => { tab.classList.add('hidden'); tab.classList.remove('active'); });
        const targetSub = document.getElementById(subViewId);
        if (targetSub) { targetSub.classList.remove('hidden'); void targetSub.offsetWidth; targetSub.classList.add('active'); }
    };

    const menuSalary = document.getElementById('menu-salary');
    if (menuSalary) menuSalary.addEventListener('click', () => showSubView('sub-salary-setup'));
    const backToSetting = document.getElementById('back-to-setting');
    if (backToSetting) backToSetting.addEventListener('click', () => document.querySelector('[data-target="setting"]').click());

    // --- Simpan Setup Gaji ---
    const btnSaveSalary = document.querySelector('#sub-salary-setup .btn-primary');
    if (btnSaveSalary) {
        btnSaveSalary.addEventListener('click', async () => {
            const salaryInput = document.querySelector('#sub-salary-setup input[type="number"]');
            const amount = salaryInput ? salaryInput.value : 0;
            const userId = localStorage.getItem("user_id");

            if (!amount || amount <= 0) { alert("Masukkan nominal gaji dengan benar!"); return; }

            try {
                btnSaveSalary.textContent = "Menyimpan...";
                const response = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ action: "save_income", user_id: userId, amount: parseFloat(amount), date: new Date().toISOString().split('T')[0] })
                });
                const result = await response.json();
                if (result.status === "success") {
                    alert(result.message);
                    fetchDashboardData();
                    document.querySelector('[data-target="setting"]').click();
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error("Salary Error:", error);
                alert("Koneksi gagal.");
            } finally {
                btnSaveSalary.textContent = "Simpan Perubahan";
            }
        });
    }
});
