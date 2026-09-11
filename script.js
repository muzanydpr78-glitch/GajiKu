document.addEventListener('DOMContentLoaded', () => {
    // --- Konfigurasi URL Backend GAS ---
    // Pastikan URL Web App (berakhir dengan /exec) Anda tempelkan di sini
    const API_URL = "URL_WEB_APP_ANDA_DISINI";

    // --- Elements ---
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

    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    const fabAdd = document.getElementById('fab-add');
    const expenseModal = document.getElementById('expense-modal');
    const overlay = document.getElementById('modal-overlay');
    const btnSaveExpense = document.getElementById('btn-save-expense');
    const catItems = document.querySelectorAll('.cat-item');

    const calDays = document.querySelectorAll('.cal-day:not(.other-month)');
    const selectedDateLabel = document.getElementById('selected-date-label');

    let isRegisterMode = false;

    // --- Navigation Flow (Landing to Auth / Guest) ---
    if (btnToLogin) {
        btnToLogin.addEventListener('click', () => {
            landingPage.classList.remove('active');
            landingPage.classList.add('hidden');
            authPage.classList.remove('hidden');
            authPage.classList.add('active');
        });
    }

    if (backToLanding) {
        backToLanding.addEventListener('click', () => {
            authPage.classList.remove('active');
            authPage.classList.add('hidden');
            landingPage.classList.remove('hidden');
            landingPage.classList.add('active');
        });
    }

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            localStorage.setItem("user_id", "USR_GUEST");
            localStorage.setItem("user_name", "Guest");
            landingPage.classList.remove('active');
            landingPage.classList.add('hidden');
            mainApp.classList.remove('hidden');
            mainApp.classList.add('active');
        });
    }

    // --- Auth Toggle (Login vs Register) ---
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

    // --- API Integration: Login & Register ---
    if (btnAuthSubmit) {
        btnAuthSubmit.addEventListener('click', async () => {
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
            const name = isRegisterMode ? document.getElementById('reg-name').value : "";

            if (!email || !password) {
                alert("Email dan password wajib diisi!");
                return;
            }

            const action = isRegisterMode ? "register" : "login";
            const payload = { action, email, password, name };

            try {
                btnAuthSubmit.textContent = "Memproses...";
                const response = await fetch(API_URL, {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
                const result = await response.json();

                if (result.status === "success") {
                    localStorage.setItem("user_id", result.user_id);
                    localStorage.setItem("user_name", result.name || name);

                    authPage.classList.remove('active');
                    authPage.classList.add('hidden');
                    mainApp.classList.remove('hidden');
                    mainApp.classList.add('active');
                } else {
                    alert(result.message || "Autentikasi gagal!");
                }
            } catch (error) {
                console.error("Error Auth:", error);
                alert("Terjadi kesalahan koneksi ke server.");
            } finally {
                btnAuthSubmit.textContent = isRegisterMode ? 'Daftar Akun' : 'Masuk';
            }
        });
    }

    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener('click', () => {
            localStorage.setItem("user_id", "USR_GOOGLE_" + Date.now());
            localStorage.setItem("user_name", "Google User");
            authPage.classList.remove('active');
            authPage.classList.add('hidden');
            mainApp.classList.remove('hidden');
            mainApp.classList.add('active');
        });
    }

    // --- Main App Navigation (Tabs) ---
    navItems.forEach(nav => {
        nav.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = nav.getAttribute('data-target');

            navItems.forEach(n => n.classList.remove('active'));
            nav.classList.add('active');

            tabContents.forEach(tab => {
                tab.classList.add('hidden');
                tab.classList.remove('active');
            });

            const activeTab = document.getElementById(`tab-${targetId}`);
            if (activeTab) {
                activeTab.classList.remove('hidden');
                void activeTab.offsetWidth;
                activeTab.classList.add('active');
            }
        });
    });

    // --- Calendar Selection ---
    calDays.forEach(day => {
        day.addEventListener('click', () => {
            calDays.forEach(d => d.classList.remove('active-date'));
            day.classList.add('active-date');
            const clickedDate = day.getAttribute('data-date');
            selectedDateLabel.textContent = `${clickedDate} Sep 2026`;
        });
    });

    // --- Modal Logic (Add Expense) ---
    let selectedCategory = "Makan";

    const openModal = () => {
        overlay.classList.add('active');
        expenseModal.classList.add('active');
        setTimeout(() => document.getElementById('expense-amount').focus(), 300);
    };

    const closeModal = () => {
        overlay.classList.remove('active');
        expenseModal.classList.remove('active');
    };

    if (fabAdd) fabAdd.addEventListener('click', openModal);
    if (overlay) overlay.addEventListener('click', closeModal);

    catItems.forEach(item => {
        item.addEventListener('click', () => {
            catItems.forEach(c => c.classList.remove('active'));
            item.classList.add('active');
            selectedCategory = item.textContent.trim().replace(/[^a-zA-Z]/g, "");
        });
    });

    // --- API Integration: Save Expense ---
    if (btnSaveExpense) {
        btnSaveExpense.addEventListener('click', async () => {
            const amount = document.getElementById('expense-amount').value;
            const note = document.getElementById('expense-note').value;
            const userId = localStorage.getItem("user_id") || "USR_GUEST";

            if (!amount) {
                alert("Masukkan nominal pengeluaran!");
                return;
            }

            const payload = {
                action: "add_expense",
                user_id: userId,
                amount: parseFloat(amount),
                category: selectedCategory,
                note: note,
                date: new Date().toISOString().split('T')[0]
            };

            try {
                btnSaveExpense.textContent = "Menyimpan...";
                const response = await fetch(API_URL, {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
                const result = await response.json();

                if (result.status === "success") {
                    closeModal();
                    document.getElementById('expense-amount').value = "";
                    document.getElementById('expense-note').value = "";
                    alert("Pengeluaran berhasil dicatat secara privat!");
                } else {
                    alert("Gagal menyimpan pengeluaran.");
                }
            } catch (error) {
                console.error("Error Expense:", error);
                alert("Koneksi ke backend gagal.");
            } finally {
                btnSaveExpense.textContent = "Simpan";
            }
        });
    }

    // --- Sub-Views Navigation (Target, Profile, Salary Setup) ---
    const showSubView = (subViewId) => {
        tabContents.forEach(tab => {
            tab.classList.add('hidden');
            tab.classList.remove('active');
        });
        const targetSub = document.getElementById(subViewId);
        if (targetSub) {
            targetSub.classList.remove('hidden');
            void targetSub.offsetWidth;
            targetSub.classList.add('active');
        }
    };

    const btnAddTargetMain = document.querySelector('#tab-target .btn-secondary');
    if (btnAddTargetMain) btnAddTargetMain.addEventListener('click', () => showSubView('sub-add-target'));

    const backToTarget = document.getElementById('back-to-target');
    if (backToTarget) backToTarget.addEventListener('click', () => document.querySelector('[data-target="target"]').click());

    const menuProfile = document.getElementById('menu-profile');
    if (menuProfile) menuProfile.addEventListener('click', () => showSubView('sub-profile'));

    const menuSalary = document.getElementById('menu-salary');
    if (menuSalary) menuSalary.addEventListener('click', () => showSubView('sub-salary-setup'));

    const backToSetting = document.getElementById('back-to-setting');
    if (backToSetting) backToSetting.addEventListener('click', () => document.querySelector('[data-target="setting"]').click());

    const backToSettingProfile = document.getElementById('back-to-setting-profile');
    if (backToSettingProfile) backToSettingProfile.addEventListener('click', () => document.querySelector('[data-target="setting"]').click());

    // --- Dynamic Add Allocation Row Feature ---
    const btnAddAllocation = document.querySelector('#sub-salary-setup .btn-secondary');
    const allocationGroup = document.querySelector('.allocation-group');

    if (btnAddAllocation && allocationGroup) {
        btnAddAllocation.addEventListener('click', () => {
            const newRow = document.createElement('div');
            newRow.className = 'alloc-row mt-10';
            newRow.innerHTML = `
                <input type="text" placeholder="Nama Alokasi" class="alloc-input">
                <input type="number" placeholder="Nominal (Rp)" class="alloc-input">
            `;
            allocationGroup.appendChild(newRow);
        });
    }
});
