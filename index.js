
        const SCRIPT_URL = 'http://localhost/wedding_wo/api.php';

const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);



        const formatWaNumber = (num) => {
            let cleaned = String(num).replace(/\D/g, '');
            if (cleaned.startsWith('0')) return '62' + cleaned.substring(1);
            if (cleaned.startsWith('8')) return '62' + cleaned;
            return cleaned;
        };

        function tampilkanToast(msg, isError = false) {
            const toast = document.getElementById('toast-success');
            const icon = toast.querySelector('i');
            document.getElementById('toast-msg').textContent = msg;

            if (isError) {
                toast.className = "fixed left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-3 rounded-full shadow-[0_8px_30px_rgba(239,68,68,0.4)] font-bold flex items-center gap-3 transition-all duration-500 pointer-events-none border border-red-300 top-[-100px]";
                icon.className = "fa-solid fa-circle-exclamation text-xl";
            } else {
                toast.className = "fixed left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-gold-600 to-gold-500 text-black px-6 py-3 rounded-full shadow-[0_8px_30px_rgba(212,175,55,0.4)] font-bold flex items-center gap-3 transition-all duration-500 pointer-events-none border border-gold-300 top-[-100px]";
                icon.className = "fa-solid fa-circle-check text-xl";
            }

           
            toast.classList.replace('top-[-100px]', 'top-20');
            setTimeout(() => { toast.classList.replace('top-20', 'top-[-100px]'); }, 3500);
        }

        let dataLoaded = { pesanan: false };
        let currentUser = null;
        let selectedMaxStok = 0;
        let authFotoBase64 = ""; let buktiBase64 = ""; let pelunasanBase64 = "";
        let fileCustomBase64 = ""; let buktiBayarTagihanBase64 = "";
        let appSettings = { logo_light: '', logo_dark: '', loginBg: '', banners: [], qris_lunas: '', qris_dp: '', qris_name: '', admin_wa: '' };
        let globalProduk = []; let listFavorit = [];
        let activeKategori = 'Semua'; let activeSort = 'terbaru';
        let globalPenjualan = [];

      
        let globalBerkas = [];
        let rawUpgradeDataCustomer = "[]";
        let bukuPanduanBase64 = "";
        let bukuPanduanLama = ""; 

      
        function cekStatusTombolBerkas() {
            const btnBerkas = document.getElementById('btn-berkas-profil');
            const btnPanduan = document.getElementById('btn-panduan-profil');
            if (!currentUser) return;

           
            const adaDiskusi = globalPenjualan.some(p => p['Status Acara'] === 'Diskusi Lanjutan' || p.Status === 'Diskusi Lanjutan');
            if (btnBerkas) {
                if (adaDiskusi) btnBerkas.classList.remove('hidden');
                else btnBerkas.classList.add('hidden');
            }

           
            const adaPanduan = globalPenjualan.some(p => {
                let stat = p['Status Acara'] || p.Status;
                return stat === 'Diskusi Lanjutan' || stat === 'Diproses' || stat === 'Selesai';
            });
            if (btnPanduan) {
                if (adaPanduan) btnPanduan.classList.remove('hidden');
                else btnPanduan.classList.add('hidden');
            }
        }

        let zoomImages = []; let zoomIdx = 0;
        let currentDetailId = null; let currentTrxPrint = null;
        let currentDetailVars = []; let selectedDetailVars = {};

        document.addEventListener('click', function (e) {
            const container = document.getElementById('wa-fab-container');
            const menu = document.getElementById('wa-menu');
            if (container && menu && !container.contains(e.target)) {
                menu.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
            }
        });

        function requireLogin() {
            if (!currentUser) {
                document.getElementById('app-section').classList.add('hidden');
                document.getElementById('auth-section').classList.remove('hidden');
                tampilkanToast("Silakan masuk untuk mengakses fitur.");
                return true;
            }
            return false;
        }

        function cancelLogin() {
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('app-section').classList.remove('hidden');
        }

        function updateAppLogos() {
            const activeLogo = appSettings.logo_dark || appSettings.logo_light;
            let logoHtml = `<div class="text-gold-500 flex justify-center drop-shadow-[0_0_15px_rgba(212,175,55,0.6)] transition-all duration-300"><i class="fa-solid fa-crown text-5xl lg:text-6xl"></i></div>`;
            let navLogoHtml = `<i class="fa-solid fa-crown text-2xl drop-shadow-[0_0_5px_rgba(212,175,55,0.6)] transition-all duration-300"></i>`;

            if (activeLogo) {
                logoHtml = `<img src="${activeLogo}" class="h-16 sm:h-24 object-contain mx-auto drop-shadow-md transition-opacity duration-300">`;
                navLogoHtml = `<img src="${activeLogo}" class="h-8 object-contain transition-opacity duration-300">`;
            }

            const authLogo = document.getElementById('app-logo-auth');
            const authLogoMobile = document.getElementById('app-logo-auth-mobile');
            const navLogo = document.getElementById('app-logo-nav-icon');

            if (authLogo) authLogo.innerHTML = logoHtml;
            if (authLogoMobile) authLogoMobile.innerHTML = logoHtml;
            if (navLogo) navLogo.innerHTML = navLogoHtml;
        }

        function togglePassword(inputId, iconId) {
            const input = document.getElementById(inputId); const icon = document.getElementById(iconId);
            if (input.type === 'password') { input.type = 'text'; icon.classList.replace('fa-eye', 'fa-eye-slash'); }
            else { input.type = 'password'; icon.classList.replace('fa-eye-slash', 'fa-eye'); }
        }

        let isFetchingKatalog = false;

       
        async function initApp() {
            checkAuth();

            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('app-section').classList.remove('hidden');
            showHome();

          
            const cachedSettings = sessionStorage.getItem('hnp_settings');
            const cachedProduk = sessionStorage.getItem('hnp_produk');

            if (cachedSettings) {
                applySettings(JSON.parse(cachedSettings));
            }
            if (cachedProduk) {
                globalProduk = JSON.parse(cachedProduk);
                populateKategori();
                terapkanFilter();
                initBanner(globalProduk);
            }

            fetchDatabaseLengkap();
        }

        async function fetchDatabaseLengkap() {
            const loader = document.getElementById('loading');
            if (loader) loader.classList.remove('hidden');

            try {
                const [resSettings, resProduk, resPenjualan, resBerkas] = await Promise.all([
                    fetch(`${SCRIPT_URL}?action=getPengaturan`).then(r => r.json()),
                    fetch(`${SCRIPT_URL}?action=getProduk`).then(r => r.json()),
                    fetch(`${SCRIPT_URL}?action=getPenjualan`).then(r => r.json()),
                    fetch(`${SCRIPT_URL}?action=getBerkas`).then(r => r.json())
                ]);

               
                if (resSettings.status === 'success') {
                    let newSettings = { banners: [] };
                    resSettings.data.forEach(item => {
                       
                        if (item.Key.toLowerCase().includes('banner') && item.Value) {
                            newSettings.banners.push(item.Value);
                        } else {
                            newSettings[item.Key] = item.Value;
                        }
                    });
                  
                    sessionStorage.setItem('hnp_settings', JSON.stringify(newSettings));
                    applySettings(newSettings);
                }

              
                if (resProduk.status === 'success') {
                    const dataBersih = resProduk.data.filter(p => parseInt(p['Kuota Tersedia'] || p.Stok || p.stok) > 0);
                    globalProduk = dataBersih;
                    sessionStorage.setItem('hnp_produk', JSON.stringify(globalProduk));

                    populateKategori();
                    terapkanFilter();
                   
                    initBanner(globalProduk);
                }

                
                if (resPenjualan.status === 'success' && currentUser) {
                    globalPenjualan = resPenjualan.data.filter(p => p['Username Klien'] === currentUser.username || p['Username Pembeli'] === currentUser.username).reverse();
                    if (resBerkas.status === 'success') globalBerkas = resBerkas.data;

                    dataLoaded.pesanan = true;
                    const badge = document.getElementById('badge-pesanan-count');
                    badge.textContent = globalPenjualan.length;
                    badge.classList.toggle('hidden', globalPenjualan.length === 0);

                    cekStatusTombolBerkas();
                    if (!document.getElementById('sec-pesanan').classList.contains('hidden')) renderTabelPesanan();
                }

            } catch (error) {
                console.error("Gagal memperbarui database:", error);
            } finally {
                if (loader) loader.classList.add('hidden');
            }
        }

        async function fetchKatalog(force = false) {
            if (!force) {
                const cached = sessionStorage.getItem('tokoBaju_produk');
                if (cached) { globalProduk = JSON.parse(cached); initBanner(globalProduk); populateKategori(); terapkanFilter(); fetchKatalogBackground(); return; }
            }
            if (isFetchingKatalog) return;
            isFetchingKatalog = true;

            const loader = document.getElementById('loading'); if (loader) loader.classList.remove('hidden');
            try {
                const res = await fetch(`${SCRIPT_URL}?action=getProduk`); const data = await res.json();
                if (data.status === 'success') {
                    globalProduk = data.data.filter(p => parseInt(p['Kuota Tersedia'] || p.Stok || p.stok) > 0);
                    sessionStorage.setItem('tokoBaju_produk', JSON.stringify(globalProduk));
                    initBanner(globalProduk); populateKategori(); terapkanFilter();
                }
            } catch (err) { }
            if (loader) loader.classList.add('hidden');
            isFetchingKatalog = false;
        }

        function toggleWaMenu() {
            const menu = document.getElementById('wa-menu');
            if (menu.classList.contains('opacity-0')) {
                menu.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
            } else { menu.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4'); }
        }

        function applySettings(data) {
            appSettings = { ...appSettings, ...data };

            
            if (appSettings.loginBg) {
                document.getElementById('dynamic-login-bg').style.backgroundImage = `url('${appSettings.loginBg}')`;
                document.getElementById('dynamic-login-bg-mobile').style.backgroundImage = `url('${appSettings.loginBg}')`;
            }
            updateAppLogos();

            
            if (appSettings.qris_name) {
                const lbl = document.getElementById('qris-nama-label');
                if (lbl) lbl.textContent = "A/N: " + appSettings.qris_name;
            }
        }

        async function fetchSettingsBg() {
            let isFirstLoad = !document.getElementById('init-loading').classList.contains('hidden');
            try {
                if (isFirstLoad) updateProgress(40, 'Mengunduh profil...');
                const res = await fetch(`${SCRIPT_URL}?action=getPengaturan`);
                const data = await res.json();
                if (data.status === 'success' && data.data) {
                    if (isFirstLoad) updateProgress(80, 'Merangkai tampilan...');
                    let newSettings = { banners: [] };
                    data.data.forEach(item => {
                        if (item.Key === 'logo_light' && item.Value) newSettings.logo_light = item.Value;
                        if (item.Key === 'logo_dark' && item.Value) newSettings.logo_dark = item.Value;
                        if (item.Key === 'login_bg' && item.Value) newSettings.loginBg = item.Value;
                        if (item.Key.startsWith('banner_') && item.Value) newSettings.banners.push(item.Value);
                        if (item.Key === 'qris_lunas' && item.Value) newSettings.qris_lunas = item.Value;
                        if (item.Key === 'qris_dp' && item.Value) newSettings.qris_dp = item.Value;
                        if (item.Key === 'qris_name' && item.Value) newSettings.qris_name = item.Value;
                        if (item.Key === 'admin_wa' && item.Value) newSettings.admin_wa = item.Value;
                        if (item.Key === 'link_buku_panduan' && item.Value) newSettings.link_buku_panduan = item.Value;
                    });
                    sessionStorage.setItem('tokoBaju_settings', JSON.stringify(newSettings));
                    applySettings(newSettings);
                }
            } catch (err) {
                if (isFirstLoad) updateProgress(80, 'Koneksi lambat...');
            } finally {
                if (isFirstLoad) {
                    updateProgress(100, 'Membuka aplikasi...');
                    tutupLoadingScreen();
                }
            }
        }

        function previewImage(event, previewId, targetVariable, isAuth = false) {
            const file = event.target.files[0];
            const preview = document.getElementById(previewId);
            const icon = preview.previousElementSibling;
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement('canvas'); const MAX_SIZE = 1200;
                    let w = img.width; let h = img.height;

                    if (w > h && w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; }
                    else if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; }

                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, w, h);

                    const base64Str = canvas.toDataURL('image/webp', 0.85);

                    if (targetVariable === 'authFotoBase64') authFotoBase64 = base64Str;
                    if (targetVariable === 'buktiBase64') buktiBase64 = base64Str;
                    if (targetVariable === 'pelunasanBase64') pelunasanBase64 = base64Str;
                    if (targetVariable === 'buktiBayarTagihanBase64') buktiBayarTagihanBase64 = base64Str;

                    preview.src = base64Str; preview.classList.remove('hidden');
                    if (icon) icon.style.display = 'none';
                }
                img.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }

        function prosesFileCustom(event) {
            const file = event.target.files[0];
            const iconContainer = document.getElementById('mc-file-icon');
            const fileNameEl = document.getElementById('mc-file-name');
            const preview = document.getElementById('mc-file-preview');

            if (!file) {
                fileCustomBase64 = ""; fileNameEl.textContent = "Pilih Dokumen";
                preview.classList.add('hidden'); iconContainer.style.display = 'block'; return;
            }

            
            if (file.size > 5 * 1024 * 1024 && file.type.includes('pdf')) {
                tampilkanToast("Ukuran PDF maksimal 5MB!", true);
                event.target.value = "";
                return;
            }

            fileNameEl.textContent = file.name;
            const reader = new FileReader();
            reader.onload = e => {
                fileCustomBase64 = e.target.result;

                if (file.type.includes('image')) {
                    preview.src = e.target.result; preview.classList.remove('hidden');
                    iconContainer.style.display = 'none';
                } else {
                    preview.classList.add('hidden');
                    iconContainer.innerHTML = `<i class="fa-solid fa-file-pdf text-3xl mb-1 text-gold-500"></i><p class="text-[10px] font-bold tracking-wider truncate px-4 text-white">${file.name}</p>`;
                    iconContainer.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        }

        function checkAuth() {
            const savedUser = localStorage.getItem('tokoBajuUser');
            if (savedUser) {
                currentUser = JSON.parse(savedUser);
                document.getElementById('nav-nama').textContent = currentUser.nama_lengkap.split(' ')[0];
                document.getElementById('nav-foto').src = currentUser.foto_profil || 'https://ui-avatars.com/api/?name=Client&background=D4AF37&color=000';
                document.getElementById('prof-nama').textContent = currentUser.nama_lengkap;
                document.getElementById('prof-user').textContent = "@" + currentUser.username;
                document.getElementById('prof-hp').textContent = currentUser.no_hp;
                document.getElementById('prof-foto').src = currentUser.foto_profil || 'https://ui-avatars.com/api/?name=Client&background=D4AF37&color=000';
                loadFavoritesFromLocal(); fetchPesananCustomer();
                document.getElementById('auth-section').classList.add('hidden');
                document.getElementById('app-section').classList.remove('hidden');
            } else {
                currentUser = null;
                document.getElementById('nav-nama').textContent = "Tamu";
                document.getElementById('nav-foto').src = 'https://ui-avatars.com/api/?name=Tamu&background=222&color=D4AF37';
                listFavorit = []; globalPenjualan = [];
                document.getElementById('badge-pesanan-count').classList.add('hidden');
            }
        }

        function switchAuthTab(tab) {
            const isLogin = tab === 'login';
            document.getElementById('form-login').classList.toggle('hidden', !isLogin);
            document.getElementById('form-register').classList.toggle('hidden', isLogin);
            const tabLogin = document.getElementById('tab-login'); const tabReg = document.getElementById('tab-register');
            if (isLogin) {
                tabLogin.className = "flex-1 py-2.5 rounded-[12px] bg-zinc-800 shadow-sm text-gold-500 font-bold text-sm transition-all duration-300 border border-gold-500/30";
                tabReg.className = "flex-1 py-2.5 rounded-[12px] text-zinc-500 hover:text-gold-400 font-bold text-sm transition-all duration-300";
                document.getElementById('auth-subtitle').textContent = "Masuk ke akun Anda untuk melanjutkan";
            } else {
                tabLogin.className = "flex-1 py-2.5 rounded-[12px] text-zinc-500 hover:text-gold-400 font-bold text-sm transition-all duration-300";
                tabReg.className = "flex-1 py-2.5 rounded-[12px] bg-zinc-800 shadow-sm text-gold-500 font-bold text-sm transition-all duration-300 border border-gold-500/30";
                document.getElementById('auth-subtitle').textContent = "Lengkapi data untuk memulai";
            }
        }

        async function handleLogin(e) {
            e.preventDefault();
            const btn = document.getElementById('btn-login'); btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>'; btn.disabled = true;
            try {
                const res = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'login', username: document.getElementById('l-user').value, password: document.getElementById('l-pass').value }),
                    headers: { 'Content-Type': 'application/json' } 
                });
                const data = await res.json();
                if (data.status === 'success') {
                    localStorage.setItem('tokoBajuUser', JSON.stringify(data.data));
                    checkAuth(); terapkanFilter();
                    if (!document.getElementById('sec-detail-produk').classList.contains('hidden') && currentDetailId) { bukaDetailProduk(currentDetailId); }
                    tampilkanToast("Berhasil Masuk!");
                } else { alert(data.message); }
            } catch (err) { console.error(err); }
            finally { btn.innerHTML = 'Masuk Sekarang'; btn.disabled = false; }
        }

        async function handleRegister(e) {
            e.preventDefault();
            if (!authFotoBase64) { alert("Silakan unggah Foto Profil Anda."); return; }
            const noHp = document.getElementById('r-hp').value;
            if (!/^[0-9]{10,15}$/.test(noHp)) { alert("Nomor WhatsApp tidak valid! Gunakan angka saja."); return; }

            const btn = document.getElementById('btn-register'); btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>'; btn.disabled = true;
            try {
                const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'register', nama_lengkap: document.getElementById('r-nama').value, no_hp: noHp, username: document.getElementById('r-user').value, password: document.getElementById('r-pass').value, foto: authFotoBase64 }), headers: { 'Content-Type': 'application/json' } });
                const data = await res.json();
                if (data.status === 'success') { alert('Berhasil mendaftar! Silakan login.'); switchAuthTab('login'); } else { alert(data.message); }
            } catch (err) { }
            finally { btn.innerHTML = 'Daftar Akun'; btn.disabled = false; }
        }

        function handleLogout() {
            if (confirm("Keluar dari aplikasi?")) {
                localStorage.removeItem('tokoBajuUser'); sessionStorage.clear();
                toggleProfileModal(); checkAuth(); showHome(); tampilkanToast("Berhasil Keluar.");
            }
        }

        function toggleProfileModal() {
            if (requireLogin()) return;
            const body = document.querySelector('body'); const modal = document.getElementById('profile-modal');
            if (modal.classList.contains('opacity-0')) { modal.classList.remove('opacity-0', 'pointer-events-none'); setTimeout(() => modal.classList.add('show'), 10); body.classList.add('modal-active'); }
            else { modal.classList.remove('show'); setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); body.classList.remove('modal-active'); }, 300); }
        }

        function openZoom(imageString, startIdx = 0) {
            zoomImages = imageString.split(',').filter(url => url.trim() !== ""); zoomIdx = startIdx;
            const track = document.getElementById('zoom-track');
            track.innerHTML = zoomImages.map((url) => `<div class="w-full h-full flex-shrink-0 snap-center-item flex items-center justify-center p-4"><img src="${url}" class="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-gold-500/20" onerror="this.src='https://via.placeholder.com/800x800?text=Gambar+Rusak'"></div>`).join('');
            document.getElementById('modal-zoom').classList.remove('opacity-0', 'pointer-events-none'); document.querySelector('body').classList.add('modal-active');
            updateZoomUI(); setTimeout(() => { track.scrollLeft = track.offsetWidth * startIdx; }, 50);
            track.onscroll = () => { const newIdx = Math.round(track.scrollLeft / track.offsetWidth); if (newIdx !== zoomIdx) { zoomIdx = newIdx; updateZoomUI(); } };
        }
        function moveZoomSlide(dir) { const track = document.getElementById('zoom-track'); zoomIdx = Math.max(0, Math.min(zoomIdx + dir, zoomImages.length - 1)); track.scrollTo({ left: track.offsetWidth * zoomIdx, behavior: 'smooth' }); updateZoomUI(); }
        function updateZoomUI() { document.getElementById('zoom-counter').textContent = `${zoomIdx + 1} / ${zoomImages.length}`; }
        function closeZoom() { document.getElementById('modal-zoom').classList.add('opacity-0', 'pointer-events-none'); document.querySelector('body').classList.remove('modal-active'); }

        function bukaBuktiModal(url, event) {
            if (event) event.stopPropagation();
            const img = document.getElementById('img-bukti-customer'); img.src = url;
            const body = document.querySelector('body'); const modal = document.getElementById('modal-bukti-customer');
            modal.classList.remove('opacity-0', 'pointer-events-none'); setTimeout(() => modal.classList.add('show'), 10); body.classList.add('modal-active');
        }
        function tutupBuktiModal() {
            const body = document.querySelector('body'); const modal = document.getElementById('modal-bukti-customer');
            modal.classList.remove('show'); setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); body.classList.remove('modal-active'); }, 300);
        }

        function loadFavoritesFromLocal() { if (!currentUser) return; const stored = localStorage.getItem(`tokoBajuFavs_${currentUser.username}`); if (stored) listFavorit = JSON.parse(stored); }
        function saveFavoritesToLocal() { if (!currentUser) return; localStorage.setItem(`tokoBajuFavs_${currentUser.username}`, JSON.stringify(listFavorit)); }

        function toggleFavorite(id, event) {
            if (event) event.stopPropagation();
            if (requireLogin()) return;
            const idx = listFavorit.indexOf(id); if (idx > -1) listFavorit.splice(idx, 1); else listFavorit.push(id); saveFavoritesToLocal();
            terapkanFilter();
            if (!document.getElementById('sec-favorite').classList.contains('hidden')) showFavorites();
            if (!document.getElementById('sec-detail-produk').classList.contains('hidden')) {
                const isFav = listFavorit.includes(id);
                document.getElementById('dtl-btn-fav').innerHTML = `<i class="${isFav ? 'fa-solid text-gold-500' : 'fa-regular text-zinc-300'} fa-heart text-lg sm:text-xl"></i>`;
            }
        }

        function populateKategori() {
            const katContainer = document.getElementById('kategori-container');
            let kats = ["Semua", ...new Set(globalProduk.map(p => p.Kategori || p.kategori).filter(Boolean))];
            katContainer.innerHTML = kats.map(k => {
                const isActive = activeKategori === k;
                const activeClass = isActive ? "bg-gold-500 text-black shadow-md border-gold-400" : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-gold-500/50";
                return `<button onclick="setKategori('${k}')" class="shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-bold transition-all ${activeClass}">${k}</button>`;
            }).join('');
        }
        function setKategori(kat) { activeKategori = kat; populateKategori(); terapkanFilter(); }
        function setSortFilter(tipe) {
            activeSort = tipe;
            const btnT = document.getElementById('btn-sort-terbaru'); const btnL = document.getElementById('btn-sort-terlaris');
            if (tipe === 'terbaru') { btnT.className = "bg-gold-600 text-black px-4 sm:px-5 py-2 rounded-full text-[11px] sm:text-xs font-bold shadow-sm transition-colors"; btnL.className = "text-zinc-400 hover:text-gold-400 px-4 sm:px-5 py-2 text-[11px] sm:text-xs font-bold transition-colors"; }
            else { btnL.className = "bg-gold-600 text-black px-4 sm:px-5 py-2 rounded-full text-[11px] sm:text-xs font-bold shadow-sm transition-colors"; btnT.className = "text-zinc-400 hover:text-gold-400 px-4 sm:px-5 py-2 text-[11px] sm:text-xs font-bold transition-colors"; }
            terapkanFilter();
        }

        function terapkanFilter() {
            let filtered = [...globalProduk];
            const q = document.getElementById('search-produk').value.toLowerCase();
            if (q) filtered = filtered.filter(p => String(p['Nama Paket WO'] || p['Nama Baju'] || p.nama || '').toLowerCase().includes(q));
            if (activeKategori !== 'Semua') filtered = filtered.filter(p => (p.Kategori || p.kategori) === activeKategori);
            if (activeSort === 'terbaru') filtered.reverse(); else filtered.sort((a, b) => (a['Kuota Tersedia'] || a.Stok || a.stok) - (b['Kuota Tersedia'] || b.Stok || b.stok));
            renderKatalogToDOM(filtered, 'product-grid');
        }

        function renderKatalogToDOM(data, containerId) {
            const grid = document.getElementById(containerId);
            if (data.length > 0) grid.innerHTML = data.map(p => {
                const id = p.ID || p.id; const nama = p['Nama Paket WO'] || p['Nama Baju'] || p.nama;
                let hargaTampil = parseInt(p['Harga Base'] || p.Harga || p.harga || 0);
                const deskripsi = p.Deskripsi || p.deskripsi || '';
                const gambarRaw = p['URL Gambar'] || p.gambar || '';
                const mainImg = String(gambarRaw).split(',')[0] || 'https://via.placeholder.com/400';
                const isFav = listFavorit.includes(id);

                let varianHtml = "";
                try {
                    const vars = JSON.parse(p.Varian || p.varian);
                    if (vars && vars.length > 0) {
                        const ukurans = [...new Set(vars.map(v => v.opsi1 || v.ukuran))];
                        varianHtml = `<span class="bg-gold-500/10 text-gold-400 border border-gold-500/20 px-2 py-0.5 rounded text-[9px] font-bold mb-2 w-max">Tipe: ${ukurans.join(', ')}</span>`;
                        const minHarga = Math.min(...vars.map(v => parseInt(v.harga)));
                        if (minHarga > 0 && minHarga !== hargaTampil) hargaTampil = minHarga;
                    }
                } catch (e) { }

                return `
                <div class="bg-zinc-900/80 backdrop-blur-xl rounded-[24px] sm:rounded-[32px] p-2 shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-zinc-800 flex flex-col group cursor-pointer hover:border-gold-500/50 hover:shadow-[0_8px_30px_rgba(212,175,55,0.15)] transition-all" onclick="bukaDetailProduk('${id}')">
                    <div class="relative h-40 sm:h-48 md:h-64 rounded-[20px] sm:rounded-[24px] overflow-hidden bg-black border border-zinc-800">
                        <img src="${mainImg}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100">
                        <button onclick="toggleFavorite('${id}', event)" class="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/50 backdrop-blur border border-zinc-700 flex items-center justify-center transition active:scale-90 z-10">
                            <i class="${isFav ? 'fa-solid fa-heart text-gold-500' : 'fa-regular fa-heart text-zinc-400'} text-sm sm:text-lg"></i>
                        </button>
                    </div>
                    <div class="p-3 sm:p-4 flex-1 flex flex-col">
                        ${varianHtml}
                        <h3 class="font-bold text-white text-xs sm:text-sm line-clamp-2 mb-1 group-hover:text-gold-400 transition-colors">${nama}</h3>
                        ${deskripsi ? `<p class="text-[10px] sm:text-xs text-zinc-500 line-clamp-2 mb-2 sm:mb-3">${deskripsi}</p>` : ''}
                        <p class="text-gold-500 font-extrabold text-sm sm:text-lg mt-auto">${formatRp(hargaTampil)}</p>
                    </div>
                </div>`;
            }).join('');
            else grid.innerHTML = `<div class="col-span-full py-20 text-center text-zinc-600 font-medium">Layanan tidak ditemukan</div>`;
        }

        function hideAllSections() { ['sec-home', 'sec-favorite', 'sec-pesanan', 'sec-detail-produk'].forEach(id => document.getElementById(id).classList.add('hidden')); }
        function showHome() { hideAllSections(); document.getElementById('sec-home').classList.remove('hidden'); fetchKatalog(); }
        function showFavorites() { if (requireLogin()) return; hideAllSections(); document.getElementById('sec-favorite').classList.remove('hidden'); renderKatalogToDOM(globalProduk.filter(p => listFavorit.includes(p.ID || p.id)), 'favorite-grid'); }
        function showPesanan() { if (requireLogin()) return; hideAllSections(); document.getElementById('sec-pesanan').classList.remove('hidden'); fetchPesananCustomer(true); }

        function bukaDetailProduk(id) {
            const p = globalProduk.find(x => (x.ID || x.id) == id); if (!p) return; currentDetailId = id;
            const nama = p['Nama Paket WO'] || p['Nama Baju'] || p.nama;
            const hargaBase = p['Harga Base'] || p.Harga || p.harga;
            const stokTotal = p['Kuota Tersedia'] || p.Stok || p.stok;
            const kat = p.Kategori || p.kategori; const deskripsi = p.Deskripsi || "Belum ada deskripsi.";
            const gambarRaw = p['URL Gambar'] || p.gambar || ''; const imgs = String(gambarRaw).split(',').filter(u => u.trim() !== ""); const mainImg = imgs[0] || 'https://via.placeholder.com/800';

            document.getElementById('dtl-nama').textContent = nama; document.getElementById('dtl-kategori').textContent = kat;

            let vars = [];
            try { vars = JSON.parse(p.Varian || p.varian); } catch (e) { }

            let labelHarga = formatRp(hargaBase);
            if (vars && vars.length > 0) {
                const hargaArr = vars.map(v => parseInt(v.harga));
                const min = Math.min(...hargaArr); const max = Math.max(...hargaArr);
                if (min !== max) labelHarga = `${formatRp(min)} - ${formatRp(max)}`;
                else labelHarga = formatRp(min);
            }

            document.getElementById('dtl-harga').textContent = labelHarga;
            document.getElementById('dtl-stok').textContent = stokTotal;
            document.getElementById('dtl-deskripsi').textContent = deskripsi;

            const imgUtama = document.getElementById('dtl-gambar-utama'); imgUtama.src = mainImg; imgUtama.onclick = () => openZoom(gambarRaw, 0);

            const thumbContainer = document.getElementById('dtl-thumbnail-container');
            if (imgs.length > 1) {
                thumbContainer.innerHTML = imgs.map((u, i) => `
                    <div onclick="document.getElementById('dtl-gambar-utama').src='${u}'; document.getElementById('dtl-gambar-utama').onclick = () => openZoom('${gambarRaw}', ${i});" class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-gold-500 shrink-0"><img src="${u}" class="w-full h-full object-cover"></div>
                `).join(''); thumbContainer.classList.remove('hidden');
            } else { thumbContainer.classList.add('hidden'); }

            const isFav = listFavorit.includes(id);
            document.getElementById('dtl-btn-fav').innerHTML = `<i class="${isFav ? 'fa-solid text-gold-500' : 'fa-regular text-zinc-300'} fa-heart text-lg sm:text-xl"></i>`;
            document.getElementById('dtl-btn-fav').onclick = (e) => toggleFavorite(id, e);

            const listVarian = document.getElementById('dtl-varian-list');

            if (!vars || vars.length === 0) {
                vars = [{ opsi1: "Default", opsi2: "Default", harga: hargaBase, stok: stokTotal }];
            } else {
                
                vars = vars.map(v => ({ opsi1: v.opsi1 || v.ukuran, opsi2: v.opsi2 || v.lengan, harga: v.harga, stok: v.stok }));
            }

            currentDetailVars = vars; selectedDetailVars = {};

            listVarian.innerHTML = vars.map((v, idx) => {
                const isDisabled = parseInt(v.stok) <= 0;
                const namaVar = (v.opsi1 === "Default" && v.opsi2 === "Default") ? "Standar Paket" : `${v.opsi1} - ${v.opsi2}`;

                return `
                <div class="flex justify-between items-center border border-zinc-800 rounded-[16px] p-3.5 bg-black ${isDisabled ? 'opacity-50' : 'hover:border-gold-500/50'} transition-colors">
                    <div>
                        <p class="font-bold text-[13px] sm:text-sm text-white leading-tight">${namaVar}</p>
                        <p class="text-[11px] sm:text-xs text-gold-400 font-extrabold mt-1">${formatRp(v.harga)} <span class="text-zinc-500 font-medium ml-1">| Kuota: ${v.stok}</span></p>
                    </div>
                    <div class="flex items-center gap-3 sm:gap-4 bg-zinc-900 rounded-full px-1.5 py-1.5 shadow-sm border border-zinc-800">
                        <button onclick="ubahVarianQty(${idx}, -1)" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black border border-zinc-700 flex items-center justify-center hover:bg-zinc-800 active:scale-90 transition ${isDisabled ? 'pointer-events-none' : ''}">
                            <i class="fa-solid fa-minus text-[10px] sm:text-xs text-white"></i>
                        </button>
                        <span id="dtl-qty-${idx}" class="text-sm font-bold w-4 text-center text-white">0</span>
                        <button onclick="ubahVarianQty(${idx}, 1)" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gold-500/20 text-gold-500 border border-gold-500/30 flex items-center justify-center hover:bg-gold-500 hover:text-black active:scale-90 transition ${isDisabled ? 'pointer-events-none' : ''}">
                            <i class="fa-solid fa-plus text-[10px] sm:text-xs"></i>
                        </button>
                    </div>
                </div>`;
            }).join('');

            evalDetailBeli();
            hideAllSections(); document.getElementById('sec-detail-produk').classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function ubahVarianQty(idx, dir) {
            const v = currentDetailVars[idx]; if (!v || v.stok <= 0) return;
            let curr = selectedDetailVars[idx] || 0; curr += dir;
            if (curr < 0) curr = 0;
            if (curr > parseInt(v.stok)) { curr = parseInt(v.stok); tampilkanToast(`Maksimal kuota tersisa adalah ${v.stok}`); }
            selectedDetailVars[idx] = curr; document.getElementById(`dtl-qty-${idx}`).textContent = curr;
            evalDetailBeli();
        }

        function evalDetailBeli() {
            let totalQty = 0; let totalPrice = 0; let arrPilihan = [];
            for (let idx in selectedDetailVars) {
                const qty = selectedDetailVars[idx];
                if (qty > 0) {
                    totalQty += qty; totalPrice += (qty * parseInt(currentDetailVars[idx].harga));
                    arrPilihan.push({ opsi1: currentDetailVars[idx].opsi1, opsi2: currentDetailVars[idx].opsi2, jumlah: qty, harga: currentDetailVars[idx].harga });
                }
            }
            const btnBeli = document.getElementById('dtl-btn-beli');
            if (totalQty > 0) {
                btnBeli.disabled = false;
                btnBeli.className = "w-full bg-gradient-to-r from-gold-600 to-gold-400 text-black py-4 sm:py-5 rounded-full font-extrabold text-base sm:text-lg shadow-[0_5px_20px_rgba(212,175,55,0.3)] active:scale-[0.98] transition-all";
                btnBeli.textContent = `Pesan Booking (${totalQty} - ${formatRp(totalPrice)})`;
                btnBeli.onclick = () => {
                    if (requireLogin()) return;
                    const p = globalProduk.find(x => (x.ID || x.id) == currentDetailId);
                    const mainImg = String(p['URL Gambar'] || p.gambar || '').split(',')[0];
                    bukaModalBeliMulti(p.ID || p.id, p['Nama Paket WO'] || p['Nama Baju'] || p.nama, arrPilihan, totalPrice, totalQty, mainImg);
                };
            } else {
                btnBeli.disabled = true;
                btnBeli.className = "w-full bg-zinc-800 text-zinc-500 py-4 sm:py-5 rounded-full font-bold text-base sm:text-lg transition-all cursor-not-allowed border border-zinc-700";
                btnBeli.textContent = "Tentukan Kuota / Varian";
                btnBeli.onclick = null;
            }
        }

        async function fetchKatalog(force = false) {
            if (!force) {
                const cached = sessionStorage.getItem('tokoBaju_produk');
                if (cached) { globalProduk = JSON.parse(cached); initBanner(globalProduk); populateKategori(); terapkanFilter(); fetchKatalogBackground(); return; }
            }
            if (isFetchingKatalog) return;
            isFetchingKatalog = true;

            const loader = document.getElementById('loading'); if (loader) loader.classList.remove('hidden');
            try {
                const res = await fetch(`${SCRIPT_URL}?action=getProduk`); const data = await res.json();
                if (data.status === 'success') {
                    globalProduk = data.data.filter(p => parseInt(p['Kuota Tersedia'] || p.Stok || p.stok) > 0);
                    sessionStorage.setItem('tokoBaju_produk', JSON.stringify(globalProduk));
                    initBanner(globalProduk); populateKategori(); terapkanFilter();
                }
            } catch (err) { }
            if (loader) loader.classList.add('hidden');
            isFetchingKatalog = false;
        }

        async function fetchKatalogBackground() {
            try {
                const res = await fetch(`${SCRIPT_URL}?action=getProduk`); const data = await res.json();
                if (data.status === 'success') {
                    const newData = data.data.filter(p => parseInt(p['Kuota Tersedia'] || p.Stok || p.stok) > 0);
                    if (JSON.stringify(newData) !== JSON.stringify(globalProduk)) {
                        globalProduk = newData; sessionStorage.setItem('tokoBaju_produk', JSON.stringify(globalProduk));
                        if (!document.getElementById('sec-home').classList.contains('hidden')) { terapkanFilter(); }
                    }
                }
            } catch (err) { }
        }

        async function fetchPesananCustomer(force = false) {
            if (!force && dataLoaded.pesanan) {
                renderTabelPesanan();
                return;
            }
            
            fetchDatabaseLengkap();
        }

        function toggleUpgradeArea() {
            const isChecked = document.getElementById('b-is-upgrade').checked;
            const area = document.getElementById('area-upgrade-paket');
            if (isChecked) {
                area.classList.remove('hidden'); if (document.getElementById('list-upgrade-paket').children.length === 0) addUpgradeRow();
            } else { area.classList.add('hidden'); }
        }

        function addUpgradeRow(nama = '', qty = 1, harga = '') {
            const container = document.getElementById('list-upgrade-paket');
            const div = document.createElement('div');
            div.className = 'upg-row flex gap-2 items-center bg-black p-2 rounded-lg border border-zinc-700';
            div.innerHTML = `
                <input type="text" class="upg-nama flex-1 w-1/3 bg-transparent text-white text-xs outline-none px-2" placeholder="Nama Upgrade" value="${nama}">
                <div class="w-px h-4 bg-zinc-700"></div>
                <input type="number" class="upg-qty w-12 bg-transparent text-white text-xs text-center outline-none" placeholder="Qty" value="${qty}" min="1">
                <div class="w-px h-4 bg-zinc-700"></div>
                <input type="number" class="upg-hrg w-24 bg-transparent text-gold-400 font-bold text-xs outline-none px-2" placeholder="Harga/item" value="${harga}">
                <button type="button" onclick="this.parentElement.remove()" class="text-zinc-500 hover:text-red-500 w-6 h-6 flex items-center justify-center"><i class="fa-solid fa-times text-[10px]"></i></button>
            `;
            container.appendChild(div);
        }

        let globalVendorClient = [];
        let activeKategoriVendor = 'Semua';

        async function fetchVendorKlien() {
            const grid = document.getElementById('vendor-grid');
            const containerKategori = document.getElementById('kategori-vendor-container');

            
            const activeLogo = appSettings.logo_dark || appSettings.logo_light;
            let logoContent = activeLogo ? `<img src="${activeLogo}" class="w-10 h-10 object-contain animate-pulse">` : `<i class="fa-solid fa-crown text-3xl text-gold-500 animate-pulse"></i>`;

            containerKategori.innerHTML = '';
            grid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-16">
                    <div class="relative w-20 h-20 flex items-center justify-center mb-4 p-2 rounded-full bg-zinc-900/50 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                        <div class="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
                        <div class="absolute inset-0 border-4 border-transparent border-t-gold-500 border-r-yellow-600 rounded-full animate-spin z-10"></div>
                        ${logoContent}
                    </div>
                    <p class="text-gold-500 font-bold text-sm animate-pulse">Menyiapkan Katalog Vendor...</p>
                </div>
            `;

            try {
                const res = await fetch(`${SCRIPT_URL}?action=getVendor`);
                const data = await res.json();
                if (data.status === 'success') {
                    globalVendorClient = data.data;
                    renderKategoriVendor();
                    renderVendorToDOM();
                }
            } catch (e) {
                grid.innerHTML = `<div class="col-span-full py-16 text-center text-red-500 text-sm font-bold">Gagal memuat data vendor.</div>`;
            }
        }

        function showVendor() {
            hideAllSections();
            document.getElementById('sec-vendor').classList.remove('hidden');
            fetchVendorKlien();
        }

        function renderKategoriVendor() {
            const container = document.getElementById('kategori-vendor-container');
            let kats = ["Semua", ...new Set(globalVendorClient.map(v => v.Kategori))];
            container.innerHTML = kats.map(k => {
                const isActive = activeKategoriVendor === k;
                const activeClass = isActive ? "bg-gold-500 text-black border-gold-400" : "bg-black text-zinc-400 border-zinc-800 hover:border-gold-500/50";
                return `<button onclick="setKategoriVendor('${k}')" class="shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${activeClass}">${k}</button>`;
            }).join('');
        }

        function setKategoriVendor(kat) {
            activeKategoriVendor = kat;
            renderKategoriVendor();
            renderVendorToDOM();
        }

        function renderVendorToDOM() {
            const grid = document.getElementById('vendor-grid');
            let filtered = globalVendorClient;
            if (activeKategoriVendor !== 'Semua') {
                filtered = filtered.filter(v => v.Kategori === activeKategoriVendor);
            }

            if (filtered.length > 0) {
                grid.innerHTML = filtered.map(v => {
                    const id = v['ID Vendor'];
                    const mainImg = (v['URL Gambar'] || '').split(',')[0] || 'https://via.placeholder.com/400';
                    return `
                    <div onclick="bukaDetailVendor('${id}')" class="bg-zinc-900/80 backdrop-blur-xl rounded-[24px] p-2 border border-zinc-800 cursor-pointer hover:border-gold-500/50 transition-all group">
                        <div class="w-full h-32 sm:h-40 rounded-[18px] overflow-hidden bg-black mb-3">
                            <img src="${mainImg}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                        </div>
                        <div class="px-2 pb-2">
                            <span class="text-[9px] font-bold text-gold-500 uppercase tracking-wider block mb-1">${v.Kategori}</span>
                            <h3 class="font-bold text-white text-sm sm:text-base truncate group-hover:text-gold-400">${v['Nama Vendor']}</h3>
                        </div>
                    </div>`;
                }).join('');
            } else {
                grid.innerHTML = `<div class="col-span-full py-16 text-center text-zinc-500 text-sm">Belum ada data vendor.</div>`;
            }
        }

        function bukaDetailVendor(id) {
            const v = globalVendorClient.find(x => x['ID Vendor'] === id); if (!v) return;

            document.getElementById('vdtl-nama').textContent = v['Nama Vendor'];
            document.getElementById('vdtl-kategori').textContent = v.Kategori;
            document.getElementById('vdtl-deskripsi').textContent = v.Deskripsi;

            const gbrRaw = v['URL Gambar'] || '';
            const imgs = gbrRaw.split(',').filter(u => u.trim() !== "");

            const imgUtama = document.getElementById('vdtl-gambar-utama');
            imgUtama.src = imgs[0] || 'https://via.placeholder.com/800';
            imgUtama.onclick = () => openZoom(gbrRaw, 0);

            const thumbContainer = document.getElementById('vdtl-thumbnail-container');
            if (imgs.length > 1) {
                thumbContainer.innerHTML = imgs.map((u, i) => `
                    <div onclick="document.getElementById('vdtl-gambar-utama').src='${u}'; document.getElementById('vdtl-gambar-utama').onclick = () => openZoom('${gbrRaw}', ${i});" class="w-14 h-14 rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-gold-500 shrink-0"><img src="${u}" class="w-full h-full object-cover"></div>
                `).join('');
                thumbContainer.classList.remove('hidden');
            } else {
                thumbContainer.classList.add('hidden');
            }

            const modal = document.getElementById('modal-detail-vendor');
            modal.classList.remove('opacity-0', 'pointer-events-none'); setTimeout(() => modal.classList.add('show'), 10); document.body.classList.add('modal-active');
        }

        function tutupDetailVendor() {
            const modal = document.getElementById('modal-detail-vendor');
            modal.classList.remove('show'); setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); document.body.classList.remove('modal-active'); }, 300);
        }

        
        const oldHideAllSections = hideAllSections;
        hideAllSections = function () {
            oldHideAllSections();
            const secVendor = document.getElementById('sec-vendor');
            if (secVendor) secVendor.classList.add('hidden');
        }
        
        function toggleModalBerkas() {
            const body = document.querySelector('body'); const modal = document.getElementById('modal-berkas');
            if (modal.classList.contains('opacity-0')) {
                modal.classList.remove('opacity-0', 'pointer-events-none'); setTimeout(() => modal.classList.add('show'), 10); body.classList.add('modal-active');
            } else {
                modal.classList.remove('show'); setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); body.classList.remove('modal-active'); }, 300);
            }
        }

        async function bukaModalBerkas() {
            
            const profileModal = document.getElementById('profile-modal');
            if (profileModal) {
                profileModal.classList.remove('show');
                profileModal.classList.add('opacity-0', 'pointer-events-none');
            }

            toggleModalBerkas();

            
            const formArea = document.getElementById('berkas-form-area');
            const loadingArea = document.getElementById('berkas-loading-area');

            formArea.classList.add('hidden');
            loadingArea.classList.remove('hidden');
            loadingArea.classList.add('flex');

            const activeLogo = appSettings.logo_dark || appSettings.logo_light;
            let logoContent = activeLogo ? `<img src="${activeLogo}" class="w-10 h-10 object-contain animate-pulse">` : `<i class="fa-solid fa-crown text-3xl text-gold-500 animate-pulse"></i>`;
            loadingArea.innerHTML = `
                <div class="relative w-20 h-20 flex items-center justify-center mb-4 p-2 rounded-full bg-zinc-900/50 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                    <div class="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
                    <div class="absolute inset-0 border-4 border-transparent border-t-gold-500 border-r-yellow-600 rounded-full animate-spin z-10"></div>
                    ${logoContent}
                </div>
                <p class="text-gold-500 font-bold text-sm animate-pulse">Membuka Dokumen Acara...</p>
                <p class="text-zinc-500 text-[10px] mt-1">Mengambil riwayat Anda</p>
            `;

            
            let linkLink = appSettings.link_buku_panduan || "#";
            if (linkLink.includes("docs.google.com/document/d/")) {
                const match = linkLink.match(/\/d\/([a-zA-Z0-9-_]+)/);
                if (match && match[1]) {
                   
                    linkLink = `https://docs.google.com/document/d/${match[1]}/export?format=doc`;
                }
            }

            let btnDownload = document.getElementById('link-download-panduan');
            btnDownload.href = linkLink;

            if (linkLink === "#") {
                btnDownload.onclick = (e) => {
                    e.preventDefault();
                    alert("Admin belum mengunggah format Buku Panduan.");
                };
            } else {
                btnDownload.onclick = null;
            }

           
            const selectId = document.getElementById('berkas-id-booking');
            const pesananDiskusi = globalPenjualan.filter(p => p['Status Acara'] === 'Diskusi Lanjutan' || p.Status === 'Diskusi Lanjutan');

            selectId.innerHTML = pesananDiskusi.map(p => {
                const id = p['ID Booking'] || p['ID Transaksi'];
                const nama = p['Nama Paket'] || p['Nama Baju'];
                return `<option value="${id}">${id} - ${nama}</option>`;
            }).join('');

           
            try {
                const res = await fetch(`${SCRIPT_URL}?action=getBerkas`);
                const data = await res.json();
                if (data.status === 'success') {
                    globalBerkas = data.data;
                }
            } catch (e) { console.log("Gagal load data berkas"); }

            loadDataBerkasTerpilih(); 

            
            loadingArea.classList.add('hidden');
            loadingArea.classList.remove('flex');
            formArea.classList.remove('hidden');
        }

        function loadDataBerkasTerpilih() {
            const idBooking = document.getElementById('berkas-id-booking').value;
            if (!idBooking) return;

            const pesanan = globalPenjualan.find(p => p['ID Booking'] === idBooking || p['ID Transaksi'] === idBooking);
            document.getElementById('b-pesanan').value = pesanan ? (pesanan['Nama Paket'] || pesanan['Nama Baju']) : '';

            bukuPanduanBase64 = ""; bukuPanduanLama = ""; document.getElementById('b-file-name').textContent = "Pilih File (.pdf/.doc)";

            const dataBerkas = globalBerkas.find(b => b['ID Booking'] === idBooking);
            document.getElementById('b-cpp').value = dataBerkas ? dataBerkas['Nama CPP'] : '';
            document.getElementById('b-cpw').value = dataBerkas ? dataBerkas['Nama CPW'] : '';

            let tglAkad = dataBerkas ? dataBerkas['Tgl Akad'] : ''; if (tglAkad && tglAkad.includes('T')) tglAkad = tglAkad.split('T')[0];
            document.getElementById('b-tgl-akad').value = tglAkad;
            document.getElementById('b-wkt-akad').value = dataBerkas ? dataBerkas['Waktu Akad'] : '';

            let tglResepsi = dataBerkas ? dataBerkas['Tgl Resepsi'] : ''; if (tglResepsi && tglResepsi.includes('T')) tglResepsi = tglResepsi.split('T')[0];
            document.getElementById('b-tgl-resepsi').value = tglResepsi;
            let wktResepsi = dataBerkas ? (dataBerkas['Waktu Resepsi'] || '') : '';
            let arrWktResepsi = wktResepsi.split(/\s*-\s*/); 
            document.getElementById('ab-wkt-resepsi-mulai').value = arrWktResepsi[0] || '';
            document.getElementById('ab-wkt-resepsi-selesai').value = arrWktResepsi[1] || '';
            document.getElementById('b-undangan').value = dataBerkas ? dataBerkas['Jumlah Undangan'] : '';
            document.getElementById('b-konsep').value = dataBerkas ? dataBerkas['Konsep Pernikahan'] : '';
            document.getElementById('b-makeup').value = dataBerkas ? dataBerkas['Konsep Make Up'] : '';
            document.getElementById('b-busana').value = dataBerkas ? dataBerkas['Busana Pengantin'] : '';
            document.getElementById('b-prewed').value = dataBerkas ? dataBerkas['Tgl & Lokasi Prewedding'] : '';
            document.getElementById('b-tm').value = dataBerkas ? dataBerkas['Tgl & Lokasi TM'] : '';
            document.getElementById('v-dekorasi').value = dataBerkas ? dataBerkas['Vendor Dekorasi'] : '';
            document.getElementById('v-mua').value = dataBerkas ? dataBerkas['Vendor MUA'] : '';
            document.getElementById('v-keluarga').value = dataBerkas ? dataBerkas['Vendor Perias Keluarga'] : '';
            document.getElementById('v-mc').value = dataBerkas ? dataBerkas['Vendor MC'] : '';
            document.getElementById('v-ent').value = dataBerkas ? dataBerkas['Vendor Entertainment'] : '';
            document.getElementById('v-catering').value = dataBerkas ? dataBerkas['Vendor Catering'] : '';
            document.getElementById('v-dok').value = dataBerkas ? dataBerkas['Vendor Dokumentasi'] : '';
            document.getElementById('v-sound').value = dataBerkas ? dataBerkas['Vendor Sound System'] : '';
            document.getElementById('v-attire').value = dataBerkas ? dataBerkas['Vendor Attire'] : '';
            document.getElementById('v-venue').value = dataBerkas ? dataBerkas['Vendor Venue'] : '';
            document.getElementById('b-catatan').value = dataBerkas ? dataBerkas['Catatan Tambahan'] : '';


            
            let dataUpgrade = dataBerkas ? dataBerkas['Data Upgrade'] : '[]';
            rawUpgradeDataCustomer = dataUpgrade; 
            const areaUpg = document.getElementById('area-tampil-upgrade-customer');
            const listUpg = document.getElementById('list-tampil-upgrade');
            listUpg.innerHTML = '';

            if (dataUpgrade && dataUpgrade !== "[]" && dataUpgrade !== "") {
                areaUpg.classList.remove('hidden');
                try {
                    let upgArr = JSON.parse(dataUpgrade);
                    if (upgArr.length > 0) {
                        upgArr.forEach(u => {
                            let sub = parseInt(u.jumlah) * parseInt(u.harga);
                            listUpg.innerHTML += `<div class="flex justify-between text-xs text-white"><span class="font-medium">- ${u.nama} (x${u.jumlah})</span><span class="text-gold-400 font-bold">${formatRp(sub)}</span></div>`;
                        });
                    } else {
                        areaUpg.classList.add('hidden');
                    }
                } catch (e) { areaUpg.classList.add('hidden'); }
            } else {
                areaUpg.classList.add('hidden');
            }

            if (dataBerkas && dataBerkas['File Buku Panduan']) {
                bukuPanduanLama = dataBerkas['File Buku Panduan'];
                document.getElementById('b-file-name').innerHTML = `<a href="${bukuPanduanLama}" target="_blank" class="text-emerald-400 underline">Lihat File Upload</a>`;
            }
        }

        function prosesBukuPanduan(event) {
            const file = event.target.files[0];
            const nameEl = document.getElementById('b-file-name');
            if (!file) {
                bukuPanduanBase64 = "";
                nameEl.textContent = bukuPanduanLama ? "Lihat File yang Terupload" : "Pilih File (.pdf/.doc)";
                return;
            }

            
            if (file.size > 5 * 1024 * 1024) {
                tampilkanToast("Ukuran dokumen maksimal 5MB!", true);
                event.target.value = "";
                return;
            }

            nameEl.textContent = file.name;
            const reader = new FileReader();

            reader.onload = e => {
                bukuPanduanBase64 = e.target.result;
            }
            reader.readAsDataURL(file);
        }

        async function simpanDataBerkas() {
            const idBooking = document.getElementById('berkas-id-booking').value;
            if (!idBooking) return alert("Pilih ID Booking terlebih dahulu!");



            const btn = document.getElementById('btn-simpan-berkas');
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...'; btn.disabled = true;

            let wktResMulai = document.getElementById('ab-wkt-resepsi-mulai').value;
            let wktResSelesai = document.getElementById('ab-wkt-resepsi-selesai').value;
            let wktResGabung = (wktResMulai && wktResSelesai) ? `${wktResMulai} - ${wktResSelesai}` : (wktResMulai || wktResSelesai || '');

            const payload = {
                action: "saveBerkas", id_booking: idBooking, username: currentUser.username, cpp: document.getElementById('b-cpp').value, cpw: document.getElementById('b-cpw').value, tgl_akad: document.getElementById('b-tgl-akad').value, waktu_akad: document.getElementById('b-wkt-akad').value, tgl_resepsi: document.getElementById('b-tgl-resepsi').value, waktu_resepsi: wktResGabung, undangan: document.getElementById('b-undangan').value, konsep: document.getElementById('b-konsep').value, makeup: document.getElementById('b-makeup').value, busana: document.getElementById('b-busana').value, pesanan: document.getElementById('b-pesanan').value, prewed: document.getElementById('b-prewed').value, tm: document.getElementById('b-tm').value, v_dekorasi: document.getElementById('v-dekorasi').value, v_mua: document.getElementById('v-mua').value, v_keluarga: document.getElementById('v-keluarga').value, v_mc: document.getElementById('v-mc').value, v_ent: document.getElementById('v-ent').value, v_catering: document.getElementById('v-catering').value, v_dok: document.getElementById('v-dok').value, v_sound: document.getElementById('v-sound').value, v_attire: document.getElementById('v-attire').value, v_venue: document.getElementById('v-venue').value, catatan: document.getElementById('b-catatan').value, file_panduan: bukuPanduanBase64, file_panduan_lama: bukuPanduanLama, data_upgrade: (rawUpgradeDataCustomer || "[]")
            };

            try {
                const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
                const data = await res.json();
                if (data.status === 'success') {
                    tampilkanToast("Berkas berhasil disimpan!"); toggleModalBerkas(); fetchPesananCustomer(true);
                } else { alert(data.message); }
            } catch (e) { alert("Gagal menyimpan data berkas."); } finally { btn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-2"></i> Simpan Data Berkas'; btn.disabled = false; }
        }

        function renderTabelPesanan() {
            const container = document.getElementById('list-pesanan-customer'); const badge = document.getElementById('badge-pesanan-count');
            badge.textContent = globalPenjualan.length; badge.classList.toggle('hidden', globalPenjualan.length === 0);

            if (globalPenjualan.length > 0) container.innerHTML = globalPenjualan.map(p => {
                const isCustom = p['ID Paket'] === 'CUSTOM' || p['ID Baju'] === 'CUSTOM'; const isDP = p['Tipe Pembayaran'] === 'DP'; const noPelunasan = !p['Bukti Pelunasan'] || p['Bukti Pelunasan'] === "Menunggu Pelunasan" || p['Bukti Pelunasan'] === "-"; const isCash = p['Metode Bayar'] === 'Cash';
                const trId = p['ID Booking'] || p['ID Transaksi']; const displayTanggal = String(p.Tanggal || '').split(',')[0]; const statusAcara = p['Status Acara'] || p.Status; const namaPaket = p['Nama Paket'] || p['Nama Baju']; const qty = p['Jumlah Pax/Item'] || p.Jumlah;

                let totalHarga = parseInt(p['Total Harga']) || 0; let statBayarStr = String(p['Status Pembayaran'] || ''); let sudahLunas = statBayarStr.toLowerCase().includes('lunas');
                const perluBayarAwal = isCustom && totalHarga > 0 && statBayarStr === 'Belum Bayar' && p['Metode Bayar'] !== 'Cash';

                
                const berkas = globalBerkas.find(b => b['ID Booking'] === trId);
                let upgradeBadge = '';
                if (berkas && berkas['Data Upgrade'] && berkas['Data Upgrade'] !== '[]' && berkas['Data Upgrade'] !== '') {
                    upgradeBadge = `<span class="bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded ml-1 uppercase align-middle whitespace-nowrap shadow-sm">Upgraded <i class="fa-solid fa-arrow-up text-[7px]"></i></span>`;
                }

                let htmlUploadLunas = ""; let htmlBukti = `<div class="flex gap-2 mt-3 flex-wrap">`;
                if (p['Bukti Pembayaran'] && p['Bukti Pembayaran'] !== "Bayar Cash" && p['Bukti Pembayaran'] !== "Bayar Cash di Kantor" && p['Bukti Pembayaran'] !== "-") htmlBukti += `<button onclick="bukaBuktiModal('${p['Bukti Pembayaran']}', event)" class="bg-zinc-800 text-gold-400 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-gold-500/20 active:scale-95 transition-transform"><i class="fa-solid fa-image"></i> Bukti Awal</button>`;

                
                if (isDP && !isCash) {
                    if ((!noPelunasan && p['Bukti Pelunasan'] !== "-") || sudahLunas) {
                        if (!noPelunasan && p['Bukti Pelunasan'] !== "-") htmlBukti += `<button onclick="bukaBuktiModal('${p['Bukti Pelunasan']}', event)" class="bg-emerald-900/30 text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-emerald-500/20 active:scale-95 transition-transform"><i class="fa-solid fa-image"></i> Struk Pelunasan</button>`;

                        let textLunasInfo = sudahLunas ? `<i class="fa-solid fa-check-double"></i> Tagihan ${p['Status Pembayaran']}` : `<i class="fa-solid fa-circle-check"></i> Bukti Pelunasan Terkirim`;
                        htmlUploadLunas = `<div class="mt-4 pt-3 border-t border-zinc-800"><p class="text-[11px] sm:text-xs font-bold text-emerald-400">${textLunasInfo}</p></div>`;
                    }
                }

                if (p['Metode Bayar'] === 'Transfer') {
                    if (statusAcara === 'Menunggu Pembayaran') {
                        
                        htmlUploadLunas += `<div class="mt-4 pt-3 border-t border-zinc-800 flex justify-end"><button onclick="event.stopPropagation(); bukaModalBayarTagihan('${trId}')" class="w-full bg-gradient-to-r from-gold-600 to-gold-400 text-black font-bold px-4 py-3 rounded-xl text-xs shadow-md shadow-gold-500/30 active:scale-95 transition-all"><i class="fa-solid fa-file-invoice-dollar mr-1"></i> Pembayaran </button></div>`;
                    } else if (statusAcara === 'Menunggu Konfirmasi' || sudahLunas) {
                       
                        htmlUploadLunas += `<div class="mt-4 pt-3 border-t border-zinc-800 flex justify-end"><button onclick="event.stopPropagation(); bukaModalBayarTagihan('${trId}')" class="w-full bg-zinc-800 text-gold-400 border border-gold-500/30 font-bold px-4 py-3 rounded-xl text-xs active:scale-95 transition-all hover:bg-zinc-700"><i class="fa-solid fa-receipt mr-1"></i> Lihat Rincian Pembayaran</button></div>`;
                    } else if (statusAcara !== 'Dibatalkan' && statusAcara !== 'Selesai') {
                     
                        let waTargetList = appSettings.admin_wa ? String(appSettings.admin_wa).split(',') : [];
                        let waTargetNum = waTargetList.length > 0 ? formatWaNumber(waTargetList[0]) : "6287752690802";
                        let textWaKonfirmasi = encodeURIComponent(`Halo Admin, saya ingin konfirmasi pesanan dengan ID Booking: *${trId}*. Apakah saya sudah bisa melakukan pembayaran untuk pesanan ini?`);

                        htmlUploadLunas += `
                        <div class="mt-4 pt-3 border-t border-zinc-800">
                            <p class="text-[10px] sm:text-xs text-orange-400 mb-2 text-center font-medium"><i class="fa-solid fa-circle-info"></i> Harap konfirmasi rincian acara & biaya ke admin sebelum melakukan pembayaran.</p>
                            <button onclick="event.stopPropagation(); window.open('https://wa.me/${waTargetNum}?text=${textWaKonfirmasi}', '_blank')" class="w-full bg-[#25D366] hover:bg-green-500 text-black font-bold px-4 py-3 rounded-xl text-xs shadow-md shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                                <i class="fa-brands fa-whatsapp text-base"></i> Konfirmasi ke WhatsApp Admin
                            </button>
                        </div>`;
                    }
                }
                htmlBukti += `</div>`;

                let hargaText = (isCustom && totalHarga === 0) ? "Menunggu Penawaran" : formatRp(totalHarga);
                let statusColor = "text-gold-400"; if (statusAcara === 'Selesai') statusColor = 'text-emerald-400'; if (statusAcara === 'Dibatalkan') statusColor = 'text-red-400';



                return `
                <div onclick="bukaDetailPesanan('${trId}')" class="bg-zinc-900/80 backdrop-blur-xl p-4 sm:p-5 rounded-[24px] shadow-lg border border-zinc-800 flex flex-col cursor-pointer hover:border-gold-500/50 transition-all group relative">
                    <div class="flex justify-between items-start">
                        <div class="pr-2">
                            <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">${trId}</span>
                            <h4 class="font-bold text-sm sm:text-base text-white mt-1 group-hover:text-gold-400 transition-colors flex items-center flex-wrap gap-x-2 gap-y-1">${namaPaket} ${upgradeBadge}</h4>
                            <p class="text-[11px] sm:text-xs text-zinc-400 mt-1">${displayTanggal} &bull; ${qty} Item &bull; <span class="${statusColor} font-bold">${statusAcara}</span></p>
                            <p class="text-[9px] sm:text-[10px] mt-1 font-bold ${sudahLunas ? 'text-emerald-500' : 'text-orange-400'}">Status: ${p['Status Pembayaran']} | Tipe: ${p['Tipe Pembayaran']} ${isDP ? `(${p['Detail DP']})` : ''}</p>
                        </div>
                        <div class="text-right shrink-0">
                            <p class="text-black font-extrabold text-sm sm:text-base bg-gradient-to-r from-gold-500 to-gold-400 px-3 py-1 rounded-lg drop-shadow-sm">${hargaText}</p>
                        </div>
                    </div>
                    <div onclick="event.stopPropagation()" class="relative z-10 cursor-default">${htmlBukti}${htmlUploadLunas}</div>
                </div>`;
            }).join('');
            else container.innerHTML = `<div class="py-20 text-center text-zinc-500 font-medium text-sm sm:text-base">Belum ada acara yang dijadwalkan</div>`;
        }


        function bukaDetailPesanan(idTrx) {
            const p = globalPenjualan.find(x => x['ID Booking'] == idTrx || x['ID Transaksi'] == idTrx); if (!p) return;
            currentTrxPrint = p; const content = document.getElementById('content-detail-pesanan');

            const isDP = p['Tipe Pembayaran'] === 'DP'; let totalHarga = parseInt(p['Total Harga']) || 0;
            let dpNominal = 0; let sisaTagihan = totalHarga; let tagihanHtml = '';

            let statusColor = "text-gold-400 bg-gold-500/10 border border-gold-500/20"; if (p['Status Acara'] === 'Selesai' || p.Status === 'Selesai') statusColor = "text-emerald-400 bg-emerald-900/30 border border-emerald-500/20"; if (p['Status Acara'] === 'Dibatalkan' || p.Status === 'Dibatalkan') statusColor = "text-red-400 bg-red-900/30 border border-red-500/20";

            let statBayarStr = String(p['Status Pembayaran'] || ''); let sudahLunas = statBayarStr.toLowerCase().includes('lunas'); let sudahDP = statBayarStr.toLowerCase().includes('sudah dp') || sudahLunas;
            let metodePelunasan = ""; if (sudahLunas && statBayarStr.includes('(')) { metodePelunasan = " " + statBayarStr.substring(statBayarStr.indexOf('(')); }

            if (isDP && p['Detail DP']) {
                const match = String(p['Detail DP']).match(/Rp\s*(\d+)/); if (match) dpNominal = parseInt(match[1]);
                if (sudahLunas) sisaTagihan = 0; else if (sudahDP) sisaTagihan = totalHarga - dpNominal; else sisaTagihan = totalHarga;

                tagihanHtml = `
                    <div class="flex justify-between items-center text-xs sm:text-sm mb-1"><span class="text-zinc-400">Total Harga Estimasi</span><span class="font-semibold text-white">${formatRp(totalHarga)}</span></div>
                    ${sudahDP ? `<div class="flex justify-between items-center text-xs sm:text-sm ${sudahLunas ? 'mb-1' : 'mb-2 sm:mb-3'} text-emerald-400"><span>Deposit / DP (${p['Detail DP']})</span><span class="font-semibold">- ${formatRp(dpNominal)}</span></div>` : `<div class="flex justify-between items-center text-xs sm:text-sm mb-2 sm:mb-3 text-orange-400"><span>Deposit / DP (Belum Dibayar)</span><span class="font-semibold">Rp 0</span></div>`}
                    ${sudahLunas ? `<div class="flex justify-between items-center text-xs sm:text-sm mb-2 sm:mb-3 text-emerald-400"><span>Pelunasan${metodePelunasan}</span><span class="font-semibold">- ${formatRp(totalHarga - dpNominal)}</span></div>` : ''}
                    <div class="pt-2 sm:pt-3 border-t border-dashed border-zinc-700 flex justify-between items-center"><span class="font-bold text-white text-xs sm:text-sm">${sudahLunas ? 'Status Tagihan' : 'Sisa Tagihan'}</span><span class="font-black ${sudahLunas ? 'text-emerald-400' : 'text-red-400'} text-base sm:text-lg">${sudahLunas ? `<i class="fa-solid fa-check-double mr-1"></i> LUNAS` : formatRp(sisaTagihan)}</span></div>`;
            } else {
                if (sudahLunas) sisaTagihan = 0;
                tagihanHtml = `
                    <div class="flex justify-between items-center text-xs sm:text-sm mb-1"><span class="text-zinc-400">Total Harga Estimasi</span><span class="font-semibold text-white">${formatRp(totalHarga)}</span></div>
                    <div class="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-dashed border-zinc-700 flex justify-between items-center"><span class="font-bold text-white text-xs sm:text-sm">${sudahLunas ? 'Status Tagihan' : 'Sisa Tagihan'}</span><span class="font-black ${sudahLunas ? 'text-emerald-400' : 'text-red-400'} text-base sm:text-lg">${sudahLunas ? `<i class="fa-solid fa-check-double mr-1"></i> LUNAS` : formatRp(sisaTagihan)}</span></div>`;
            }

            let varDetailHtml = "-";
            try { const varObj = JSON.parse(p['Detail Pilihan'] || p['Varian Detail']); if (Array.isArray(varObj)) { varDetailHtml = `<ul class="list-disc list-inside text-xs text-gold-200 ml-4 mt-1">` + varObj.map(v => `<li>${v.opsi1 || v.ukuran} - ${v.opsi2 || v.lengan} (x${v.jumlah})</li>`).join('') + `</ul>`; } else if (varObj.opsi1 || varObj.ukuran) { varDetailHtml = `<span class="bg-gold-500/20 border border-gold-500/30 text-gold-400 px-2 py-0.5 rounded text-[10px] font-bold inline-block mt-1">${varObj.opsi1 || varObj.ukuran} - ${varObj.opsi2 || varObj.lengan}</span>`; } } catch (e) { }

            const berkas = globalBerkas.find(b => b['ID Booking'] === idTrx);
            let upgradeRincianHtml = '';
            if (berkas && berkas['Data Upgrade'] && berkas['Data Upgrade'] !== '[]' && berkas['Data Upgrade'] !== '') {
                try {
                    let upgArr = JSON.parse(berkas['Data Upgrade']);
                    if (upgArr.length > 0) {
                        upgradeRincianHtml = `<div class="mt-3 pt-3 border-t border-zinc-800"><p class="text-[10px] font-bold text-blue-400 mb-1"><i class="fa-solid fa-arrow-up-right-dots"></i> Rincian Tambahan (Upgrade):</p><ul class="list-disc list-inside text-xs text-zinc-300 space-y-1">`;
                        upgArr.forEach(u => { let sub = parseInt(u.jumlah) * parseInt(u.harga); upgradeRincianHtml += `<li><span class="font-medium">${u.nama}</span> (x${u.jumlah}) - <span class="text-gold-400 font-semibold">${formatRp(sub)}</span></li>`; });
                        upgradeRincianHtml += `</ul></div>`;
                    }
                } catch (e) { }
            }

            let waNumbers = appSettings.admin_wa ? String(appSettings.admin_wa).split(',') : ["6287752690802"];
            const textPesan = encodeURIComponent(`Halo Tim Elegance WO, saya ingin berkoordinasi mengenai Booking.\n\nID Booking: *${p['ID Booking'] || p['ID Transaksi']}*\nLayanan: *${p['Nama Paket'] || p['Nama Baju']}*\nTotal: *${formatRp(totalHarga)}*\n\nTerima kasih.`);
            const waButtonsHtml = waNumbers.map((num) => { return `<a href="https://wa.me/${formatWaNumber(num)}?text=${textPesan}" target="_blank" class="flex items-center justify-center gap-2 w-full bg-[#25D366] text-black font-bold py-3 sm:py-3.5 px-4 rounded-[16px] transition-all active:scale-95 shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:bg-green-500 mb-2 text-sm sm:text-base"><i class="fa-brands fa-whatsapp text-xl"></i> Chat Event Coordinator</a>`; }).join('');

           
            let btnBayarHtml = "";
            if (p['Metode Bayar'] === 'Transfer') {
                btnBayarHtml = `<button onclick="event.stopPropagation(); bukaModalBayarTagihan('${idTrx}')" class="w-full mt-4 bg-gradient-to-r from-gold-600 to-gold-400 text-black font-extrabold py-3.5 rounded-xl shadow-lg hover:scale-[0.98] transition-all text-sm"><i class="fa-solid fa-file-invoice-dollar mr-2"></i> Selesaikan Pembayaran / Upload Bukti</button>`;
            } else if (p['Metode Bayar'] === 'Cash') {
                btnBayarHtml = `<div class="w-full mt-4 bg-gold-500/10 text-gold-500 border border-gold-500/30 font-bold py-3.5 rounded-xl text-center text-sm"><i class="fa-solid fa-handshake"></i> Pembayaran Cash di Kantor</div>`;
            }

          
            let btnPanduanHtml = "";
            let statAcara = p['Status Acara'] || p.Status;

            if (statAcara === 'Diskusi Lanjutan' || statAcara === 'Diproses' || statAcara === 'Selesai') {
                btnPanduanHtml = `
                <button onclick="bukaModalPanduanKlien('${idTrx}')" class="w-full mt-3 bg-yellow-900/30 hover:bg-yellow-600 text-yellow-400 hover:text-black border border-yellow-500/20 font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
                    <i class="fa-solid fa-pen-to-square"></i> Lihat & Edit Buku Panduan
                </button>`;
            }

            
            content.innerHTML = `
                <div class="bg-black border border-zinc-800 p-3 sm:p-4 rounded-[16px] sm:rounded-[20px]">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ID: ${p['ID Booking'] || p['ID Transaksi']}</span>
                        <span class="px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold ${statusColor}">${p['Status Acara'] || p.Status}</span>
                    </div>
                    <p class="text-[11px] sm:text-sm font-medium text-gold-500"><i class="fa-regular fa-calendar mr-1"></i> ${p.Tanggal}</p>
                </div>
                <div class="border border-zinc-700 bg-zinc-900 rounded-[16px] sm:rounded-[20px] p-3 sm:p-4 mt-3">
                    <h4 class="font-bold text-white mb-1 text-sm sm:text-base">${p['Nama Paket'] || p['Nama Baju']}</h4>
                    <p class="text-[11px] sm:text-sm text-zinc-400 mb-2">Item/Pax: ${p['Jumlah Pax/Item'] || p.Jumlah}</p>
                    <div class="mb-3"><span class="text-[11px] sm:text-sm text-zinc-400 font-bold">Rincian:</span><br>${varDetailHtml}</div>
                    ${upgradeRincianHtml}
                    <div class="h-px bg-zinc-800 w-full mb-2 sm:mb-3 mt-3"></div>
                    <div class="flex justify-between items-center text-[11px] sm:text-sm mb-1.5 sm:mb-2"><span class="text-zinc-400">Metode Bayar</span><span class="font-semibold text-white">${p['Metode Bayar'] || '-'}</span></div>
                    <div class="flex justify-between items-center text-[11px] sm:text-sm mb-1.5 sm:mb-2"><span class="text-zinc-400">Tipe Pembayaran</span><span class="font-semibold text-white">${p['Tipe Pembayaran']} ${isDP ? `<span class="text-[9px] sm:text-[10px] text-zinc-500 font-normal ml-1">(${p['Detail DP']})</span>` : ''}</span></div>
                    <div class="flex justify-between items-center text-[11px] sm:text-sm"><span class="text-zinc-400">Status Pembayaran</span><span class="font-semibold ${sudahLunas ? 'text-emerald-400' : 'text-orange-400'}">${statBayarStr}</span></div>
                </div>
                <div class="bg-black border border-gold-500/20 rounded-[16px] sm:rounded-[20px] p-3 sm:p-4 mt-3 mb-4 shadow-[0_0_15px_rgba(212,175,55,0.05)]">
                    <h5 class="font-bold text-gold-500 mb-2 sm:mb-3 text-[13px] sm:text-sm">Rincian Pembayaran</h5>
                    ${totalHarga === 0 ? '<p class="text-xs text-orange-400 font-bold italic">Menunggu penawaran dari Tim WO.</p>' : tagihanHtml}
                </div>
                ${btnBayarHtml}
                ${waButtonsHtml}
                ${btnPanduanHtml} 
            `;
            const modal = document.getElementById('modal-detail-pesanan'); modal.classList.remove('opacity-0', 'pointer-events-none'); setTimeout(() => modal.classList.add('show'), 10); document.body.classList.add('modal-active');
        }

        function tutupDetailPesanan() {
            const body = document.querySelector('body'); const modal = document.getElementById('modal-detail-pesanan');
            modal.classList.remove('show'); setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); body.classList.remove('modal-active'); }, 300);
        }

        function cetakStruk() {
            if (!currentTrxPrint) return;
            const p = currentTrxPrint; const isDP = p['Tipe Pembayaran'] === 'DP';
            let totalHarga = parseInt(p['Total Harga']) || 0; let dpNominal = 0;
            if (isDP && p['Detail DP']) { const match = String(p['Detail DP']).match(/Rp\s*(\d+)/); if (match) dpNominal = parseInt(match[1]); }

            let statBayarStr = String(p['Status Pembayaran'] || '');
            let sudahLunas = statBayarStr.toLowerCase().includes('lunas');
            let sudahDP = statBayarStr.toLowerCase().includes('sudah dp') || sudahLunas;

            let sisaTagihan = totalHarga;
            if (isDP) {
                if (sudahLunas) sisaTagihan = 0;
                else if (sudahDP) sisaTagihan = totalHarga - dpNominal;
            } else {
                if (sudahLunas) sisaTagihan = 0;
            }

            let statAcara = p['Status Acara'] || p.Status;
            let statusColor = "#D4AF37"; if (statAcara === 'Selesai') statusColor = "#10b981"; if (statAcara === 'Dibatalkan') statusColor = "#ef4444";

            let tagihanStatus = sudahLunas ? "LUNAS" : "BELUM LUNAS";
            if (statBayarStr.toLowerCase().includes('belum bayar') || statBayarStr.toLowerCase().includes('belum dp')) {
                tagihanStatus = "BELUM LUNAS";
            }
            let tagihanColor = (tagihanStatus === 'LUNAS') ? '#10b981' : '#ef4444';
            let metodePelunasan = ""; if (sudahLunas && statBayarStr.includes('(')) { metodePelunasan = " " + statBayarStr.substring(statBayarStr.indexOf('(')); }

            let varDetailStr = "-";
            try {
                const varObj = JSON.parse(p['Detail Pilihan'] || p['Varian Detail']);
                if (Array.isArray(varObj)) { varDetailStr = varObj.map(v => `${v.opsi1 || v.ukuran}-${v.opsi2 || v.lengan}(${v.jumlah})`).join(', '); }
                else if (varObj.opsi1 || varObj.ukuran) { varDetailStr = `${varObj.opsi1 || varObj.ukuran} - ${varObj.opsi2 || varObj.lengan}`; }
            } catch (e) { }

            
            const berkas = globalBerkas.find(b => b['ID Booking'] === (p['ID Booking'] || p['ID Transaksi']));
            let upgradeTotal = 0; let upgradeRows = '';
            if (berkas && berkas['Data Upgrade'] && berkas['Data Upgrade'] !== '[]' && berkas['Data Upgrade'] !== '') {
                try {
                    let upgArr = JSON.parse(berkas['Data Upgrade']);
                    upgArr.forEach(u => {
                        let sub = parseInt(u.jumlah) * parseInt(u.harga); upgradeTotal += sub;
                        upgradeRows += `<tr><td style="font-weight: 500; color:#555;">&nbsp;&nbsp;↳ Tambahan/Upgrade: ${u.nama}</td><td style="font-size: 12px; color: #999;">-</td><td class="text-center" style="font-weight: 500;">${u.jumlah}</td><td class="text-right" style="color: #666; font-weight: bold;">${formatRp(sub)}</td></tr>`;
                    });
                } catch (e) { }
            }

            const printLogoUrl = appSettings.logo_light || appSettings.logo_dark || '';

            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invoice - ${p['ID Booking'] || p['ID Transaksi']}</title>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; font-size: 13px; color: #333; max-width: 800px; margin: auto; background: #fff; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #D4AF37; padding-bottom: 15px; margin-bottom: 20px; }
                        .header img { max-height: 50px; }
                        .header h1 { margin: 0; color: #D4AF37; font-size: 24px; }
                        .title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; text-decoration: underline; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #ddd; padding: 10px; vertical-align: middle; }
                        th.bg-gray { background-color: #f9f9f9; text-align: left; }
                        .section-title { background-color: #D4AF37; color: white; font-weight: bold; padding: 8px 10px; margin-top: 20px; margin-bottom: 10px; font-size: 14px; border-radius: 4px; }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        .font-bold { font-weight: bold; }
                        @media print { body { padding: 0; margin: 0; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>${printLogoUrl ? `<img src="${printLogoUrl}">` : `<h1>ELEGANCE WO</h1>`}</div>
                        <div style="text-align: right;"><b>INVOICE TAGIHAN</b><br>ID: ${p['ID Booking'] || p['ID Transaksi']}</div>
                    </div>
                    <div class="title">INVOICE ACARA</div>
                    
                    <div class="section-title">INFORMASI KLIEN & ACARA</div>
                    <table>
                        <tr><th class="bg-gray" style="width: 35%;">Nama Klien</th><td>${p['Username Klien'] || p['Username Pembeli']}</td></tr>
                        <tr><th class="bg-gray">Tanggal Transaksi</th><td>${p.Tanggal.split(',')[0]}</td></tr>
                        <tr><th class="bg-gray">Metode Pembayaran</th><td>${p['Metode Bayar'] || '-'} (${p['Tipe Pembayaran']})</td></tr>
                        <tr><th class="bg-gray">Status Pembayaran</th><td style="color: ${tagihanColor}; font-weight: bold;">${statBayarStr}</td></tr>
                        <tr><th class="bg-gray">Status Acara</th><td style="color: ${statusColor}; font-weight: bold;">${statAcara}</td></tr>
                    </table>

                    <div class="section-title">RINCIAN PESANAN</div>
                    <table>
                        <thead>
                            <tr class="bg-gray">
                                <th style="text-align: left;">Paket Layanan</th>
                                <th style="text-align: left;">Pilihan / Varian</th>
                                <th class="text-center">Qty / Pax</th>
                                <th class="text-right">Harga Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="font-bold" style="font-size: 14px;">${p['Nama Paket'] || p['Nama Baju']}</td>
                                <td style="color: #555;">${varDetailStr}</td>
                                <td class="text-center font-bold">${p['Jumlah Pax/Item'] || p.Jumlah}</td>
                                <td class="text-right font-bold" style="color: #D4AF37; font-size: 14px;">${formatRp(totalHarga - upgradeTotal)}</td>
                            </tr>
                            ${upgradeRows}
                        </tbody>
                    </table>

                    <div class="section-title">RINGKASAN BIAYA</div>
                    <table>
                        <tr><th class="bg-gray" style="width: 70%; text-align: right;">Total Biaya Akhir</th><td class="text-right font-bold">${formatRp(totalHarga)}</td></tr>
                        ${(isDP && sudahDP) ? `<tr><th class="bg-gray" style="width: 70%; text-align: right;">Deposit Dibayar</th><td class="text-right font-bold" style="color: #ef4444;">- ${formatRp(dpNominal)}</td></tr>` : ''}
                        ${(isDP && sudahLunas) ? `<tr><th class="bg-gray" style="width: 70%; text-align: right;">Pelunasan${metodePelunasan}</th><td class="text-right font-bold" style="color: #ef4444;">- ${formatRp(totalHarga - dpNominal)}</td></tr>` : ''}
                        <tr><th class="bg-gray" style="width: 70%; text-align: right; font-size: 15px;">${sudahLunas ? 'STATUS TAGIHAN' : 'SISA TAGIHAN'}</th><td class="text-right font-bold" style="font-size: 16px; color: ${tagihanColor};">${sudahLunas ? `LUNAS` : `${formatRp(sisaTagihan)}`}</td></tr>
                    </table>
                    
                    <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #777;">
                        Terima kasih atas kepercayaan Anda merangkai momen berharga bersama kami.<br>
                        Dicetak otomatis melalui Sistem Manajemen WO.
                    </div>
                    <script>window.onload = function() { setTimeout(() => { window.print(); }, 500); }<\/script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }

        function prosesUploadPelunasan(event, idTrx) {
            const file = event.target.files[0]; if (!file) return;
            const loader = document.getElementById(`loading_${idTrx}`); loader.classList.remove('hidden');
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = async function () {
                    const canvas = document.createElement('canvas'); const MAX_SIZE = 800;
                    let w = img.width; let h = img.height;
                    if (w > h && w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; } else if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; }
                    canvas.width = w; canvas.height = h; canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    const b64 = canvas.toDataURL('image/jpeg', 0.8);
                    try {
                        const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "updateBuktiPelunasan", id_transaksi: idTrx, bukti_pelunasan: b64 }), headers: { 'Content-Type': 'text/plain' } });
                        const data = await res.json();
                        if (data.status === 'success') { alert('Bukti pelunasan berhasil dikirim!'); fetchPesananCustomer(true); } else alert(data.message);
                    } catch (err) { } loader.classList.add('hidden');
                }
                img.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }

        let bIdx = 0; let bInterval; let bStart = 0;
        function initBanner(products) {
            const track = document.getElementById('banner-track');
            const dots = document.getElementById('banner-dots');
            if (!track) return;

           
            let bSource = [...appSettings.banners.filter(b => b && String(b).trim() !== "")];

          
            if (bSource.length === 0) {
                const prodImgs = products
                    .filter(p => (p['URL Gambar'] || p.gambar))
                    .map(p => String(p['URL Gambar'] || p.gambar).split(',')[0]);
                bSource = prodImgs.slice(0, 3);
            }

            
            const grafisBanners = [
                { type: 'grafis', bg: 'from-zinc-900 to-black', icon: 'fa-gem', title: 'Elegant Wedding', sub: 'Pilihan eksklusif untuk hari istimewa' },
                { type: 'grafis', bg: 'from-yellow-900 to-black', icon: 'fa-crown', title: 'Luxury Service', sub: 'Pelayanan terbaik untuk momen berharga' }
            ];

            if (bSource.length === 0) {
                bSource = grafisBanners;
            }

            track.innerHTML = bSource.map((item, i) => {
                if (typeof item === 'string') {
                    return `<div class="slide absolute inset-0 transition-opacity duration-700 ${i === 0 ? 'opacity-100' : 'opacity-0'}">
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
                        <img src="${item}" class="w-full h-full object-cover">
                        <div class="absolute bottom-12 left-8 z-20 text-white">
                            <h2 class="text-2xl sm:text-4xl font-extrabold mb-2 text-gold-400 drop-shadow-lg">HNP Organizer</h2>
                        </div>
                    </div>`;
                } else {
                    return `<div class="slide absolute inset-0 transition-opacity duration-700 ${i === 0 ? 'opacity-100' : 'opacity-0'} bg-gradient-to-br ${item.bg} flex items-center justify-center text-center p-8 border border-gold-500/20">
                        <div>
                            <i class="fa-solid ${item.icon} text-gold-500/20 text-6xl sm:text-8xl mb-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></i>
                            <div class="relative z-10"><h2 class="text-2xl sm:text-4xl font-black text-gold-400 mb-2">${item.title}</h2><p class="text-xs sm:text-sm text-zinc-300 bg-black/50 px-4 py-2 rounded-full inline-block border border-gold-500/30">${item.sub}</p></div>
                        </div>
                    </div>`;
                }
            }).join('');

           
            dots.innerHTML = bSource.map((_, i) => `<div class="w-2 h-2 rounded-full transition-all ${i === 0 ? 'bg-gold-500 w-6' : 'bg-zinc-600'}"></div>`).join('');
            bIdx = 0;
            clearInterval(bInterval);
            bInterval = setInterval(() => bNav(1), 5000);
        }
        function bNav(dir) {
            const slides = document.querySelectorAll('.slide'); if (!slides.length) return;
            const dots = document.getElementById('banner-dots').children;
            slides[bIdx].classList.replace('opacity-100', 'opacity-0'); dots[bIdx].classList.replace('bg-gold-500', 'bg-zinc-600'); dots[bIdx].classList.replace('w-6', 'w-2'); dots[bIdx].classList.remove('shadow-[0_0_8px_#D4AF37]');
            bIdx = (bIdx + dir + slides.length) % slides.length;
            slides[bIdx].classList.replace('opacity-0', 'opacity-100'); dots[bIdx].classList.replace('bg-zinc-600', 'bg-gold-500'); dots[bIdx].classList.add('w-6', 'shadow-[0_0_8px_#D4AF37]');
        }
        function nextSlideManual() { clearInterval(bInterval); bNav(1); bInterval = setInterval(() => bNav(1), 5000); }
        function prevSlide() { clearInterval(bInterval); bNav(-1); bInterval = setInterval(() => bNav(1), 5000); }
        function handleBannerTouchStart(e) { bStart = e.changedTouches[0].screenX; }
        function handleBannerTouchEnd(e) { let end = e.changedTouches[0].screenX; if (end < bStart - 50) nextSlideManual(); if (end > bStart + 50) prevSlide(); }

        const checkoutModal = document.getElementById('checkout-modal');
        function toggleCheckoutModal() {
            const body = document.querySelector('body');
            if (checkoutModal.classList.contains('opacity-0')) { checkoutModal.classList.remove('opacity-0', 'pointer-events-none'); setTimeout(() => checkoutModal.classList.add('show'), 10); body.classList.add('modal-active'); }
            else { checkoutModal.classList.remove('show'); setTimeout(() => { checkoutModal.classList.add('opacity-0', 'pointer-events-none'); body.classList.remove('modal-active'); }, 300); }
        }

        function bukaModalBeliMulti(id, nama, arrPilihan, totalPrice, totalQty, gambar) {
            document.getElementById('m-id').value = id;
            document.getElementById('m-nama').textContent = nama;
            document.getElementById('m-harga').textContent = formatRp(totalPrice);
            document.getElementById('m-gambar').src = gambar;

            document.getElementById('m-total-base').value = totalPrice;
            document.getElementById('m-total-qty').value = totalQty;
            document.getElementById('m-varian-array-json').value = JSON.stringify(arrPilihan);

            const listVarianUi = document.getElementById('m-varian-list-checkout');
            listVarianUi.innerHTML = arrPilihan.map(v => {
                const title = (v.opsi1 === "Default" && v.opsi2 === "Default") ? "Standar Paket" : `${v.opsi1}-${v.opsi2}`;
                return `<div class="flex justify-between items-center text-[11px] sm:text-xs"><span class="font-bold text-zinc-300"><i class="fa-solid fa-check text-gold-500 mr-1.5"></i>${title}</span> <span class="bg-gold-500/20 text-gold-400 border border-gold-500/30 px-2 py-0.5 rounded font-bold">x${v.jumlah}</span></div>`;
            }).join('');

            document.querySelector('input[name="metode_bayar"][value="Transfer"]').checked = true;
            document.querySelector('input[name="tipe_bayar"][value="Lunas"]').checked = true;
            document.getElementById('dp-pct').value = "30";

            toggleMetodeUI(); toggleDPUI(); hitungTotalModal(); toggleCheckoutModal();
        }

        function bukaModalCustom() {
            if (requireLogin()) return; 
            toggleModalCustom();
        }

        function toggleModalCustom() {
            if (requireLogin()) return;
            const body = document.querySelector('body'); const modal = document.getElementById('modal-custom');
            if (modal.classList.contains('opacity-0')) {
                modal.classList.remove('opacity-0', 'pointer-events-none'); setTimeout(() => modal.classList.add('show'), 10); body.classList.add('modal-active');
                if (document.getElementById('mc-varian-list').children.length === 0) { addVarianCustom(); }
            }
            else { modal.classList.remove('show'); setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); body.classList.remove('modal-active'); }, 300); }
        }

        function addVarianCustom() {
            const div = document.createElement('div'); div.className = "flex gap-2 items-center vc-row bg-black p-2 rounded-xl border border-zinc-700 shadow-sm";
            div.innerHTML = `
                <select class="vc-uk w-20 bg-transparent outline-none text-xs font-bold text-white"><option>Indoor</option><option>Outdoor</option><option>Gedung</option><option>Hotel</option></select>
                <div class="h-4 w-px bg-zinc-700"></div>
                <select class="vc-len flex-1 bg-transparent outline-none text-xs font-bold text-white"><option>Standard</option><option>Premium</option><option>VIP</option></select>
                <div class="h-4 w-px bg-zinc-700"></div>
                <input type="number" value="1" min="1" placeholder="Pax" title="Pax/Kuantitas" class="vc-qty w-14 bg-transparent outline-none text-xs font-bold text-center text-white border-b border-zinc-700 focus:border-gold-500">
                <button onclick="this.parentElement.remove()" class="text-zinc-500 hover:text-red-500 w-6 h-6 rounded-full flex items-center justify-center transition"><i class="fa-solid fa-times text-[10px]"></i></button>
            `;
            document.getElementById('mc-varian-list').appendChild(div);
        }

        async function submitCustomOrder() {
            const varians = [];
            document.querySelectorAll('.vc-row').forEach(r => { varians.push({ opsi1: r.querySelector('.vc-uk').value, opsi2: r.querySelector('.vc-len').value, jumlah: r.querySelector('.vc-qty').value }); });
            if (varians.length === 0) { alert("Isi minimal 1 kebutuhan item/pax!"); return; }

            const btn = document.getElementById('btn-submit-custom');
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Memproses Konsep...'; btn.disabled = true;

            const payload = {
                action: "addCustomOrder", username: currentUser.username,
                kategori: document.getElementById('mc-kat').value,
                varian: JSON.stringify(varians), deskripsi: document.getElementById('mc-desc').value,
                file: fileCustomBase64
            };

            try {
                const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
                const d = await res.json();
                if (d.status === 'success') {
                    toggleModalCustom();

                    document.getElementById('mc-varian-list').innerHTML = ''; document.getElementById('mc-desc').value = '';
                    fileCustomBase64 = ""; document.getElementById('mc-file-name').textContent = "Pilih Dokumen";
                    document.getElementById('mc-file-preview').classList.add('hidden'); document.getElementById('mc-file-icon').style.display = 'block';

                    tampilkanToast("Konsep Acara Terkirim!");

                    let waNumbers = appSettings.admin_wa ? String(appSettings.admin_wa).split(',') : [];
                    let waTarget = waNumbers.length > 0 ? formatWaNumber(waNumbers[0]) : "6287752690802";
                    setTimeout(() => { window.open(`https://wa.me/${waTarget}?text=${encodeURIComponent("Halo Elegance WO, saya telah mengirim draft konsep pernikahan custom dengan ID: " + d.id_transaksi + ". Mohon dicek dan mari diskusikan estimasi biayanya.")}`, '_blank'); }, 500);

                    fetchPesananCustomer(true);
                } else { alert(d.message); }
            } catch (e) { alert("Gagal mengirim data. Periksa koneksi."); } finally { btn.innerHTML = 'Kirim & Diskusi via WA'; btn.disabled = false; }
        }

        function toggleModalBayar() {
            const body = document.querySelector('body'); const modal = document.getElementById('modal-bayar-tagihan');
            if (modal.classList.contains('opacity-0')) { modal.classList.remove('opacity-0', 'pointer-events-none'); setTimeout(() => modal.classList.add('show'), 10); body.classList.add('modal-active'); }
            else { modal.classList.remove('show'); setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); body.classList.remove('modal-active'); }, 300); }
        }

        function bukaModalBayarTagihan(idTrx) {
            const p = globalPenjualan.find(x => x['ID Booking'] == idTrx || x['ID Transaksi'] == idTrx);
            if (!p) return;

            const isDP = p['Tipe Pembayaran'] === 'DP';
            let totalHarga = parseInt(p['Total Harga']) || 0;
            let dpNominal = 0;
            if (isDP && p['Detail DP']) {
                const match = String(p['Detail DP']).match(/Rp\s*(\d+)/);
                if (match) dpNominal = parseInt(match[1]);
            }

            let qrisDP = appSettings.qris_dp || 'https://via.placeholder.com/250/000000/D4AF37?text=QRIS+DP';
            let qrisLunas = appSettings.qris_lunas || 'https://via.placeholder.com/250/000000/D4AF37?text=QRIS+Lunas';
            let qrisName = appSettings.qris_name || '-';

            document.getElementById('mbt-id').value = idTrx;

            let hasBukti1 = p['Bukti Pembayaran'] && p['Bukti Pembayaran'] !== '-' && p['Bukti Pembayaran'] !== 'Bayar Cash' && p['Bukti Pembayaran'] !== 'Bayar Cash di Kantor';
            let hasBukti2 = p['Bukti Pelunasan'] && p['Bukti Pelunasan'] !== '-' && p['Bukti Pelunasan'] !== 'Menunggu Pelunasan';

            let html = "";

            if (isDP) {
                html += `
                <div class="bg-black border border-zinc-800 p-4 rounded-[20px] text-center mb-4">
                    <p class="text-xs font-bold text-zinc-500 uppercase mb-1">Total Tagihan: ${formatRp(totalHarga)}</p>
                    <p class="text-xs font-bold text-gold-500 mb-3">Deposit (DP): ${formatRp(dpNominal)}</p>
                    <div class="bg-white p-2 rounded-xl inline-block mb-2">
                        <img src="${qrisDP}" class="w-32 h-32 object-contain mx-auto rounded-[8px] border-2 border-gold-500">
                    </div>
                    <p class="text-[10px] font-bold text-black bg-gold-400 px-3 py-1 rounded-full inline-block uppercase mb-2">A/N: ${qrisName}</p>
                </div>
                
                <div class="text-left bg-zinc-800/40 p-4 rounded-xl border border-zinc-700 mb-4">
                    <label class="block text-xs font-bold text-gold-400 mb-2">1. Upload Bukti DP ${hasBukti1 ? '<span class="text-emerald-500 ml-1"><i class="fa-solid fa-check-circle"></i> Sudah</span>' : ''}</label>
                    <div class="flex gap-2">
                        <input type="file" id="mbt-file-dp" accept="image/*" class="hidden" onchange="prosesUploadBuktiCepat(event, '${idTrx}', 'dp')">
                        <button onclick="document.getElementById('mbt-file-dp').click()" class="bg-zinc-800 border border-gold-500/30 text-gold-400 px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-zinc-700 transition w-full"><i class="fa-solid fa-upload"></i> Pilih & Kirim Bukti DP</button>
                    </div>
                    <p id="loading-mbt-dp" class="text-[10px] text-gold-500 hidden mt-2"><i class="fa-solid fa-circle-notch fa-spin"></i> Mengunggah...</p>
                </div>

                <div class="text-left bg-zinc-800/40 p-4 rounded-xl border border-zinc-700">
                    <label class="block text-xs font-bold text-emerald-400 mb-2">2. Upload Bukti Pelunasan ${hasBukti2 ? '<span class="text-emerald-500 ml-1"><i class="fa-solid fa-check-circle"></i> Sudah</span>' : ''}</label>
                    <p class="text-[10px] text-zinc-400 mb-2">Sisa Pelunasan: ${formatRp(totalHarga - dpNominal)}</p>
                    <div class="flex gap-2">
                        <input type="file" id="mbt-file-lunas" accept="image/*" class="hidden" onchange="prosesUploadBuktiCepat(event, '${idTrx}', 'lunas')">
                        <button onclick="document.getElementById('mbt-file-lunas').click()" class="bg-zinc-800 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-zinc-700 transition w-full"><i class="fa-solid fa-upload"></i> Pilih & Kirim Pelunasan</button>
                    </div>
                    <p id="loading-mbt-lunas" class="text-[10px] text-gold-500 hidden mt-2"><i class="fa-solid fa-circle-notch fa-spin"></i> Mengunggah...</p>
                </div>`;
            } else {
                html += `
                <div class="bg-black border border-zinc-800 p-4 rounded-[20px] text-center mb-4">
                    <p class="text-xs font-bold text-zinc-500 uppercase mb-1">Pelunasan Penuh</p>
                    <p class="text-lg font-black text-gold-400 mb-3">${formatRp(totalHarga)}</p>
                    <div class="bg-white p-2 rounded-xl inline-block mb-2">
                        <img src="${qrisLunas}" class="w-32 h-32 object-contain mx-auto rounded-[8px] border-2 border-gold-500">
                    </div>
                    <p class="text-[10px] font-bold text-black bg-gold-400 px-3 py-1 rounded-full inline-block uppercase mb-2">A/N: ${qrisName}</p>
                </div>
                
                <div class="text-left bg-zinc-800/40 p-4 rounded-xl border border-zinc-700">
                    <label class="block text-xs font-bold text-gold-400 mb-2">Upload Bukti Pelunasan ${hasBukti1 ? '<span class="text-emerald-500 ml-1"><i class="fa-solid fa-check-circle"></i> Sudah</span>' : ''}</label>
                    <div class="flex gap-2">
                        <input type="file" id="mbt-file-lunas-full" accept="image/*" class="hidden" onchange="prosesUploadBuktiCepat(event, '${idTrx}', 'lunas_full')">
                        <button onclick="document.getElementById('mbt-file-lunas-full').click()" class="bg-zinc-800 border border-gold-500/30 text-gold-400 px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-zinc-700 transition w-full"><i class="fa-solid fa-upload"></i> Pilih & Kirim Bukti</button>
                    </div>
                    <p id="loading-mbt-lunas-full" class="text-[10px] text-gold-500 hidden mt-2"><i class="fa-solid fa-circle-notch fa-spin"></i> Mengunggah...</p>
                </div>`;
            }

            document.getElementById('mbt-dynamic-content').innerHTML = html;
            toggleModalBayar();
        }

        async function prosesUploadBuktiCepat(event, idTrx, tipeUpload) {
            const file = event.target.files[0];
            if (!file) return;

            let loaderId = 'loading-mbt-' + tipeUpload;
            if (tipeUpload === 'dp') loaderId = 'loading-mbt-dp';
            if (tipeUpload === 'lunas') loaderId = 'loading-mbt-lunas';
            if (tipeUpload === 'lunas_full') loaderId = 'loading-mbt-lunas-full';

            const loader = document.getElementById(loaderId);
            if (loader) loader.classList.remove('hidden');

            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = async function () {
                    const canvas = document.createElement('canvas'); const MAX_SIZE = 800;
                    let w = img.width; let h = img.height;
                    if (w > h && w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; } else if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; }
                    canvas.width = w; canvas.height = h; canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    const b64 = canvas.toDataURL('image/jpeg', 0.8);

                    try {
                        let actionTarget = "bayarTagihan"; 
                        let payload = { id_transaksi: idTrx, bukti: b64, is_dp: (tipeUpload === 'dp') };

                        if (tipeUpload === 'lunas') {
                            actionTarget = "updateBuktiPelunasan"; 
                            payload = { id_transaksi: idTrx, bukti_pelunasan: b64 };
                        } else if (tipeUpload === 'lunas_full') {
                            actionTarget = "bayarTagihan";
                            payload = { id_transaksi: idTrx, bukti: b64, is_dp: false };
                        }

                        const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: actionTarget, ...payload }), headers: { 'Content-Type': 'application/json' } });
                        const data = await res.json();
                        if (data.status === 'success') {
                            tampilkanToast('Bukti berhasil dikirim!');
                            fetchPesananCustomer(true);
                            bukaModalBayarTagihan(idTrx); 
                        } else {
                            alert(data.message);
                        }
                    } catch (err) { alert("Kesalahan Jaringan."); }
                    if (loader) loader.classList.add('hidden');
                }
                img.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }

        function toggleMetodeUI() {
            const isQris = document.querySelector('input[name="metode_bayar"]:checked').value === "Transfer";
            if (isQris) {
                document.getElementById('area-cash-info').classList.add('hidden');
                const isDP = document.querySelector('input[name="tipe_bayar"]:checked').value === "DP";
                document.getElementById('lbl-total').textContent = isDP ? "DP yang harus di Transfer" : "Total yang harus di Transfer";
            } else {
                document.getElementById('area-cash-info').classList.remove('hidden');
                document.getElementById('lbl-total').textContent = "Total Keseluruhan";
            }
        }

        function toggleDPUI() {
            const isDP = document.querySelector('input[name="tipe_bayar"]:checked').value === "DP";
            const customArea = document.getElementById('area-custom-dp');

            if (isDP) {
                customArea.classList.remove('hidden');
            } else {
                customArea.classList.add('hidden');
            }
            toggleMetodeUI(); hitungTotalModal();
        }

        function hitungDP(sumber) {
            let total = parseInt(document.getElementById('m-total-base').value) || 0;
            let inpPct = document.getElementById('dp-pct'); let inpNom = document.getElementById('dp-nom');
            if (sumber === 'pct') { let p = parseFloat(inpPct.value) || 0; if (p > 100) { p = 100; inpPct.value = 100; } inpNom.value = Math.round(total * (p / 100)); }
            else if (sumber === 'nom') { let n = parseFloat(inpNom.value) || 0; if (n > total) { n = total; inpNom.value = total; } inpPct.value = ((n / total) * 100).toFixed(1); }
            hitungTotalModal(false);
        }

        function hitungTotalModal(resetDP = true) {
            let t = parseInt(document.getElementById('m-total-base').value) || 0;
            const tipe = document.querySelector('input[name="tipe_bayar"]:checked').value;

            if (tipe === "DP") {
                if (resetDP) {
                    let p = parseFloat(document.getElementById('dp-pct').value) || 30;
                    document.getElementById('dp-nom').value = Math.round(t * (p / 100));
                }
                let dpNom = parseInt(document.getElementById('dp-nom').value) || 0;
                document.getElementById('m-totalharga').textContent = formatRp(dpNom);
            } else {
                document.getElementById('m-totalharga').textContent = formatRp(t);
            }
        }

        function animateToCart(sourceRect, imgUrl) {
            const cartIcon = document.getElementById('nav-cart-icon');
            if (!cartIcon) { showPesanan(); return; }
            const iconRect = cartIcon.getBoundingClientRect();
            const ghost = document.createElement('img');
            ghost.src = imgUrl; ghost.className = 'fixed z-[9999] rounded-[16px] object-cover shadow-2xl border-2 border-gold-500';
            ghost.style.left = sourceRect.left + 'px'; ghost.style.top = sourceRect.top + 'px'; ghost.style.width = sourceRect.width + 'px'; ghost.style.height = sourceRect.height + 'px';
            ghost.style.transition = 'all 0.8s cubic-bezier(0.5, -0.5, 0.2, 1.5)'; ghost.style.pointerEvents = 'none';
            document.body.appendChild(ghost);

            const deltaX = (iconRect.left + iconRect.width / 2) - (sourceRect.left + sourceRect.width / 2);
            const deltaY = (iconRect.top + iconRect.height / 2) - (sourceRect.top + sourceRect.height / 2);

            requestAnimationFrame(() => {
                ghost.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.05) rotate(15deg)`;
                ghost.style.opacity = '0.5'; ghost.style.borderRadius = '50%';
            });
            setTimeout(() => {
                ghost.remove(); cartIcon.classList.add('scale-125', 'text-gold-500', 'animate-pulse');
                setTimeout(() => cartIcon.classList.remove('scale-125', 'text-gold-500', 'animate-pulse'), 400);
                showPesanan();
            }, 800);
        }

        async function prosesBeli(e) {
            e.preventDefault();
            const metode = document.querySelector('input[name="metode_bayar"]:checked').value;
            const tipe = document.querySelector('input[name="tipe_bayar"]:checked').value;

            buktiBase64 = "";

            let dpDetailStr = "-"; if (tipe === "DP") { dpDetailStr = `${document.getElementById('dp-pct').value}% (Rp ${document.getElementById('dp-nom').value})`; }
            const btn = document.getElementById('btn-proses-beli'); btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Memproses...'; btn.disabled = true;

            const payload = {
                action: "addPenjualan", username: currentUser.username,
                id_paket: document.getElementById('m-id').value, nama_paket: document.getElementById('m-nama').textContent,
                jumlah: parseInt(document.getElementById('m-total-qty').value), total_harga: parseInt(document.getElementById('m-total-base').value),
                varian_array: document.getElementById('m-varian-array-json').value, tipe_pembayaran: tipe, metode_bayar: metode,
                detail_dp: dpDetailStr, bukti_pembayaran: buktiBase64
            };

            try {
                const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
                const data = await res.json();
                if (data.status === 'success') {
                    toggleCheckoutModal(); fetchKatalog(true); fetchPesananCustomer(true);
                    tampilkanToast("Booking Berhasil!");

                    let waNumbers = appSettings.admin_wa ? String(appSettings.admin_wa).split(',') : [];
                    let waTarget = waNumbers.length > 0 ? formatWaNumber(waNumbers[0]) : "6287752690802";
                    let textWa = encodeURIComponent(`Halo Admin Elegance WO,\nSaya baru saja melakukan *Konfirmasi Booking*.\n\n*ID Booking:* ${data.id_transaksi || '-'}\n*Paket:* ${document.getElementById('m-nama').textContent}\n*Tipe Bayar:* ${tipe} - ${metode}\n\nMohon panduannya untuk proses administrasi/pembayaran selanjutnya. Terima kasih 🙏`);

                    setTimeout(() => {
                        window.open(`https://wa.me/${waTarget}?text=${textWa}`, '_blank');
                        showPesanan();
                    }, 500);
                } else { tampilkanToast(data.message, true); }
            } catch (err) { tampilkanToast("Gagal memproses. Pastikan koneksi stabil.", true); } finally { btn.innerHTML = 'Konfirmasi Booking & Lanjut WA'; btn.disabled = false; }
        }

        function cetakBerkasKlien() {
            const idBooking = document.getElementById('berkas-id-booking').value;
            if (!idBooking) return alert("Pilih ID Booking terlebih dahulu!");

            let wktResMulai = document.getElementById('ab-wkt-resepsi-mulai').value;
            let wktResSelesai = document.getElementById('ab-wkt-resepsi-selesai').value;
            let wktResGabung = (wktResMulai && wktResSelesai) ? `${wktResMulai} - ${wktResSelesai}` : (wktResMulai || wktResSelesai || '-');

            const data = {
                id: idBooking, klien: currentUser ? currentUser.nama_lengkap : '-', cpp: document.getElementById('b-cpp').value || '-', cpw: document.getElementById('b-cpw').value || '-', tglAkad: document.getElementById('b-tgl-akad').value || '-', wktAkad: document.getElementById('b-wkt-akad').value || '-', tglResepsi: document.getElementById('b-tgl-resepsi').value || '-', wktResepsi: wktResGabung, undangan: document.getElementById('b-undangan').value || '-', pesanan: document.getElementById('b-pesanan').value || '-', konsep: document.getElementById('b-konsep').value || '-', makeup: document.getElementById('b-makeup').value || '-', busana: document.getElementById('b-busana').value || '-', prewed: document.getElementById('b-prewed').value || '-', tm: document.getElementById('b-tm').value || '-', vDekor: document.getElementById('v-dekorasi').value || '-', vMua: document.getElementById('v-mua').value || '-', vKel: document.getElementById('v-keluarga').value || '-', vMc: document.getElementById('v-mc').value || '-', vEnt: document.getElementById('v-ent').value || '-', vCat: document.getElementById('v-catering').value || '-', vDok: document.getElementById('v-dok').value || '-', vSnd: document.getElementById('v-sound').value || '-', vAtr: document.getElementById('v-attire').value || '-', vVen: document.getElementById('v-venue').value || '-', catatan: document.getElementById('b-catatan').value || '-'
            };

            
            let upgradeArr = [];
            if (rawUpgradeDataCustomer && rawUpgradeDataCustomer !== "[]" && rawUpgradeDataCustomer !== "") {
                try {
                    let upgParsed = JSON.parse(rawUpgradeDataCustomer);
                    upgParsed.forEach(u => {
                        if (u.nama) upgradeArr.push(`<li>${u.nama} (x${u.jumlah})</li>`);
                    });
                } catch (e) { }
            }

            let upgradeHtml = upgradeArr.length > 0 ? `<tr><th>Upgrade / Tambahan</th><td><ul style="margin:0; padding-left:15px;">${upgradeArr.join('')}</ul></td></tr>` : '';

            const printLogoUrl = appSettings.logo_light || appSettings.logo_dark || '';
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html><html><head><title>Berkas Acara - ${data.id}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; font-size: 13px; color: #333; max-width: 800px; margin: auto; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #D4AF37; padding-bottom: 15px; margin-bottom: 20px; }
                    .header img { max-height: 50px; }
                    .header h1 { margin: 0; color: #D4AF37; font-size: 24px; }
                    .title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; text-decoration: underline; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; vertical-align: top; }
                    th { background-color: #f9f9f9; text-align: left; width: 35%; font-weight: bold; }
                    .section-title { background-color: #D4AF37; color: white; font-weight: bold; padding: 8px 10px; margin-top: 20px; margin-bottom: 10px; font-size: 14px; border-radius: 4px; }
                    @media print { body { padding: 0; margin: 0; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
                </style>
                </head><body>
                    <div class="header"><div>${printLogoUrl ? `<img src="${printLogoUrl}">` : `<h1>ELEGANCE WO</h1>`}</div><div style="text-align: right;"><b>BERKAS ACARA</b><br>ID: ${data.id}</div></div>
                    <div class="title">DATA LOGISTIK & PERSIAPAN ACARA</div>
                    <div class="section-title">1. DATA PENGANTIN & ACARA</div>
                    <table>
                        <tr><th>Nama Akun Pemesan</th><td>${data.klien}</td></tr><tr><th>Nama Calon Pengantin Pria (CPP)</th><td>${data.cpp}</td></tr><tr><th>Nama Calon Pengantin Wanita (CPW)</th><td>${data.cpw}</td></tr><tr><th>Jadwal Akad / Pemberkatan</th><td>${data.tglAkad} | Pukul: ${data.wktAkad}</td></tr><tr><th>Jadwal Resepsi</th><td>${data.tglResepsi} | Pukul: ${data.wktResepsi}</td></tr><tr><th>Estimasi Undangan</th><td>${data.undangan} Pax</td></tr>
                    </table>
                    <div class="section-title">2. DETAIL LAYANAN & KONSEP</div>
                    <table>
                        <tr><th>Paket yang Dipesan</th><td>${data.pesanan}</td></tr>
                        ${upgradeHtml}
                        <tr><th>Konsep / Tema Acara</th><td>${data.konsep}</td></tr><tr><th>Konsep Make Up</th><td>${data.makeup}</td></tr><tr><th>Kebutuhan Busana</th><td>${data.busana}</td></tr>
                    </table>
                    <div class="section-title">3. JADWAL PERSIAPAN KHUSUS</div>
                    <table><tr><th>Jadwal Prewedding</th><td><pre style="font-family:inherit; margin:0;">${data.prewed}</pre></td></tr><tr><th>Jadwal Technical Meeting (TM)</th><td><pre style="font-family:inherit; margin:0;">${data.tm}</pre></td></tr></table>
                    <div class="section-title">4. DAFTAR VENDOR REKANAN</div>
                    <table>
                        <tr><th>Venue / Gedung</th><td>${data.vVen}</td></tr><tr><th>Dekorasi</th><td>${data.vDekor}</td></tr><tr><th>Catering</th><td>${data.vCat}</td></tr><tr><th>MUA Pengantin</th><td>${data.vMua}</td></tr><tr><th>Perias Keluarga</th><td>${data.vKel}</td></tr><tr><th>Attire / Busana</th><td>${data.vAtr}</td></tr><tr><th>Dokumentasi (Foto/Video)</th><td>${data.vDok}</td></tr><tr><th>MC Acara</th><td>${data.vMc}</td></tr><tr><th>Entertainment / Musik</th><td>${data.vEnt}</td></tr><tr><th>Sound System</th><td>${data.vSnd}</td></tr>
                    </table>
                    <div class="section-title">5. CATATAN KHUSUS</div>
                    <div style="border: 1px solid #ddd; padding: 15px; min-height: 80px; white-space: pre-wrap;">${data.catatan}</div>
                    <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #777;">Dicetak otomatis melalui Sistem Manajemen WO.</div>
                    <script>window.onload = function() { setTimeout(() => { window.print(); }, 500); }<\/script>
                </body></html>
            `);
            printWindow.document.close();
        }

       

        function toggleModalPanduanKlien() {
            const modal = document.getElementById('modal-panduan-klien');
            if (modal.classList.contains('opacity-0')) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                setTimeout(() => modal.classList.add('show'), 10);
                document.body.classList.add('modal-active');
            } else {
                modal.classList.remove('show');
                setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); document.body.classList.remove('modal-active'); }, 300);
            }
        }

       
        let defaultPanduanTemplate = `
            <div class="a5-page" contenteditable="true">
                <br><br><br>
                <h2 style="text-align:center; color: #D4AF37;">BUKU PANDUAN ACARA</h2>
                <h1 style="text-align:center; font-size:24pt; margin-top:10px;">(CPP/CPW) & (CPW/CPP)</h1>
                <p style="text-align:center; font-size:14pt; margin-top:5px;">(TANGGAL, BULAN, TAHUN)</p>
                <br><br>
                <p style="text-align:center; color: #666; font-size:10pt;">Susun Rundown, Checklist, dan Denah Lokasi di lembar ini.</p>
            </div>
        `;

        function toggleModalPanduanKlien() {
            const modal = document.getElementById('modal-panduan-klien');
            if (modal.classList.contains('opacity-0')) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                setTimeout(() => modal.classList.add('show'), 10);
                document.body.classList.add('modal-active');
            } else {
                modal.classList.remove('show');
                setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); document.body.classList.remove('modal-active'); }, 300);
            }
        }

     
        function bukaModalPanduanDariProfil() {
           
            const pesananValid = globalPenjualan.filter(p => {
                let stat = p['Status Acara'] || p.Status;
                return (stat === 'Diskusi Lanjutan' || stat === 'Diproses' || stat === 'Selesai') &&
                    (p['Username Klien'] === currentUser.username || p['Username Pembeli'] === currentUser.username);
            });

            if (pesananValid.length === 0) return alert("Belum ada pesanan yang masuk tahap panduan.");

            const select = document.getElementById('select-panduan-id');
            select.innerHTML = pesananValid.map(p => `<option value="${p['ID Booking'] || p['ID Transaksi']}">${p['ID Booking'] || p['ID Transaksi']} - ${p['Nama Paket'] || p['Nama Baju']}</option>`).join('');

          
            const profileModal = document.getElementById('profile-modal');
            if (profileModal) {
                profileModal.classList.remove('show');
                profileModal.classList.add('opacity-0', 'pointer-events-none');
            }
            toggleModalPanduanKlien();
            loadDataPanduanTerpilih();
        }

        
        function loadDataPanduanTerpilih() {
            const idTrx = document.getElementById('select-panduan-id').value;
            if (!idTrx) return;

            const berkas = globalBerkas.find(b => b['ID Booking'] === idTrx);
            const area = document.getElementById('area-editor-panduan-klien');

            if (berkas && berkas['HTML Panduan'] && berkas['HTML Panduan'].trim() !== "") {
                area.innerHTML = berkas['HTML Panduan'];
            } else {
                let tempHTML = defaultPanduanTemplate;
                if (berkas) {
                    tempHTML = tempHTML.replace(/\(CPW\/CPP\)/g, berkas['Nama CPW'] || '(CPW)');
                    tempHTML = tempHTML.replace(/\(CPP\/CPW\)/g, berkas['Nama CPP'] || '(CPP)');
                    let tglAkad = berkas['Tgl Akad'] ? berkas['Tgl Akad'].split('T')[0] : '(TANGGAL, BULAN, TAHUN)';
                    tempHTML = tempHTML.replace(/\(TANGGAL, BULAN, TAHUN\)/g, tglAkad);
                }
                area.innerHTML = tempHTML;
            }

            setTimeout(() => {
               
                const coverLogos = area.querySelectorAll('#panduan-cover-logo');
                coverLogos.forEach(logo => {
                    const logoUrl = appSettings.logo_dark || appSettings.logo_light || '';
                    logo.src = logoUrl;
                    if (!logoUrl) logo.style.display = 'none';
                });

                
                area.querySelectorAll('.a5-page').forEach(el => el.setAttribute('contenteditable', 'true'));
                area.querySelectorAll('.no-print').forEach(el => el.style.display = 'none');
                area.querySelectorAll('#layout-placeholder-text').forEach(el => el.style.display = 'none');
                inisialisasiDraggableKlien();
            }, 50);
        }

        
        function formatTeksKlien(command, value = null) {
            document.execCommand(command, false, value);
            const activeArea = document.querySelector('#area-editor-panduan-klien .a5-page:focus-within');
            if (activeArea) activeArea.focus();
        }

        function resetFormatTeksKlien() {
            document.execCommand('removeFormat', false, null);
            document.execCommand('unlink', false, null);
            document.execCommand('foreColor', false, '#000000');
            document.execCommand('backColor', false, 'transparent');
        }

        function tambahKertasA5Klien() {
            const area = document.getElementById('area-editor-panduan-klien');
            const newPage = document.createElement('div');
            newPage.className = "a5-page";
            newPage.setAttribute("contenteditable", "true");
            newPage.innerHTML = "<p><br></p>"; 
            area.appendChild(newPage);
            newPage.scrollIntoView({ behavior: "smooth" });
        }

        function hapusKertasA5Klien() {
            const area = document.getElementById('area-editor-panduan-klien');
            const pages = area.querySelectorAll('.a5-page');
            if (pages.length > 1) {
                if (confirm("Hapus halaman paling bawah?")) {
                    area.removeChild(pages[pages.length - 1]);
                }
            } else {
                alert("Minimal harus ada 1 halaman!");
            }
        }

        function tambahElemenTeksKlien() {
            const page = document.querySelector('#area-editor-panduan-klien .a5-page:last-child') || document.querySelector('#area-editor-panduan-klien .a5-page');
            if (!page) return;
            const el = document.createElement('div');
            el.className = "draggable-item no-print-border";
            el.contentEditable = "true";
            el.style.position = "absolute";
            el.style.top = "50px";
            el.style.left = "50px";
            el.style.padding = "5px";
            el.style.border = "1px dashed #ccc";
            el.style.minWidth = "100px";
            el.style.zIndex = "10";
            el.innerHTML = "Teks Bebas (Bisa Digeser)";
            page.appendChild(el);
            makeDraggableKlien(el);
        }

        function tambahElemenGambarKlien(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (e) {
                const page = document.querySelector('#area-editor-panduan-klien .a5-page:last-child') || document.querySelector('#area-editor-panduan-klien .a5-page');
                if (!page) return;

                const wrapper = document.createElement('div');
                wrapper.className = "draggable-item no-print-border";
                wrapper.style.position = "absolute";
                wrapper.style.top = "100px";
                wrapper.style.left = "100px";
                wrapper.style.padding = "5px";
                wrapper.style.border = "1px dashed #ccc";
                wrapper.style.cursor = "move";
                wrapper.style.zIndex = "5";

                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.maxWidth = "200px";
                img.style.maxHeight = "300px";
                img.style.pointerEvents = "none";

                wrapper.appendChild(img);

                const btnHapus = document.createElement('button');
                btnHapus.innerHTML = "X";
                btnHapus.className = "no-print";
                btnHapus.style.position = "absolute";
                btnHapus.style.top = "-10px";
                btnHapus.style.right = "-10px";
                btnHapus.style.background = "red";
                btnHapus.style.color = "white";
                btnHapus.style.border = "none";
                btnHapus.style.borderRadius = "50%";
                btnHapus.style.cursor = "pointer";
                btnHapus.onclick = function () { wrapper.remove(); };
                wrapper.appendChild(btnHapus);

                page.appendChild(wrapper);
                makeDraggableKlien(wrapper);
            }
            reader.readAsDataURL(file);
            event.target.value = '';
        }

        function inisialisasiDraggableKlien() {
            const items = document.querySelectorAll('#area-editor-panduan-klien .draggable-item');
            items.forEach(item => { makeDraggableKlien(item); });
        }

        function makeDraggableKlien(el) {
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            el.onmousedown = dragMouseDown;

            function dragMouseDown(e) {
                if (e.target.tagName.toLowerCase() === 'button') return;
                e = e || window.event;
                
                if (el.contentEditable === "true" && e.target === el) {
                    
                } else {
                    e.preventDefault();
                }
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
            }

            function elementDrag(e) {
                e = e || window.event;
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                el.style.top = (el.offsetTop - pos2) + "px";
                el.style.left = (el.offsetLeft - pos1) + "px";
            }

            function closeDragElement() {
                document.onmouseup = null;
                document.onmousemove = null;
            }
        }

        
        async function simpanPanduanKlienByCustomer() {
            const idTrx = document.getElementById('select-panduan-id').value;
            const btn = document.getElementById('btn-simpan-panduan-klien');
            const ogHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';
            btn.disabled = true;

            const htmlContent = document.getElementById('area-editor-panduan-klien').innerHTML;

            const payload = {
                action: "savePanduanHTML",
                id_booking: idTrx,
                html_panduan: htmlContent
            };

            try {
                const res = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();

                if (data.status === 'success') {
                    tampilkanToast("Buku Panduan berhasil disimpan!");

                    
                    let berkasIdx = globalBerkas.findIndex(b => b['ID Booking'] === idTrx);
                    if (berkasIdx !== -1) {
                        globalBerkas[berkasIdx]['HTML Panduan'] = htmlContent;
                    } else {
                        globalBerkas.push({ 'ID Booking': idTrx, 'HTML Panduan': htmlContent });
                    }
                } else {
                    alert("Gagal menyimpan: " + data.message);
                }
            } catch (e) {
                alert("Kesalahan jaringan saat menyimpan panduan.");
            }

            btn.innerHTML = ogHtml;
            btn.disabled = false;
        }

        function hubungiAdminWa() {
            
            document.getElementById('wa-menu').classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');

            
            let waValue = String(appSettings.admin_wa || "");

         
            if (waValue.trim() === "") {
                tampilkanToast("Nomor WhatsApp Admin belum diatur di sistem.", true);
                return;
            }

            
            let waNumbers = waValue.split(',');
            let firstNum = formatWaNumber(waNumbers[0]);
            let textWa = encodeURIComponent("Halo Admin HNP Wedding Organizer, saya ingin konsultasi mengenai paket pernikahan.");

            window.open(`https://wa.me/${firstNum}?text=${textWa}`, '_blank');
        }

        window.onload = initApp;

