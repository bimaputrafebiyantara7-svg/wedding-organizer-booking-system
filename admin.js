
         const SCRIPT_URL = 'http://localhost/wedding_wo/api.php';

const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

        const showLoading = (show) => {
            const ind = document.getElementById('loading-indicator');
            if (show) {
                ind.classList.remove('hidden');
                ind.classList.add('flex');
            } else {
                ind.classList.add('hidden');
                ind.classList.remove('flex');
            }
        };

       
        let dataLoaded = { dashboard: false, produk: false, penjualan: false, pelanggan: false, pengaturan: false, berkas: false };
        let globalBerkas = [];
        let globalCatatanHNP = [];
        let currentDateHNP = new Date();

        let dashData = { totalProduk: 0, totalTerjual: 0, totalPendapatan: 0 };
        let globalPenjualan = [];
        let globalPelanggan = [];
        let globalProduk = [];
        let activeBulanFilter = 'Semua Waktu';
        let isEditingProduk = false;
        let produkIdToEdit = null;
        let navVisible = false;
        let desktopSidebarVisible = true;
        let syncInterval = null;

        let appSettings = {};
        let currentTrxPrint = null;

        var base64LogoLight = "";
        var base64LogoDark = "";
        var base64LoginBg = "";
        var base64Ban1 = "";
        var base64Ban2 = "";
        var base64Ban3 = "";
        var base64QrisLunas = "";
        var base64QrisDp = "";

        let cropperInstance = null;
        let targetPreview = '';
        let targetVarBase64 = '';
        let isLargeSize = false;
        let base64GambarArray = [];

        let activeTranskripId = null;
        let activeTranskripBulan = 'Semua Waktu';

       
        function addVariantRow(opt1 = '', opt2 = 'Default', harga = 0, stok = 0) {
            const container = document.getElementById('variant-container');
            const div = document.createElement('div');
            div.className = 'variant-row flex flex-wrap md:flex-nowrap gap-2 items-end bg-[#111] p-2 md:p-3 rounded-lg border border-zinc-800 mb-2';

            div.innerHTML = `
                <div class="w-full md:w-1/4">
                    <label class="block text-[9px] md:text-[10px] text-zinc-500 mb-1">Nama Opsi (Cth: VIP/Reguler)</label>
                    <input type="text" class="var-opt1 w-full bg-black border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-white focus:border-gold-500 outline-none" placeholder="Nama Pilihan" value="${opt1}" required>
                </div>
                <div class="w-full md:w-1/4">
                    <label class="block text-[9px] md:text-[10px] text-zinc-500 mb-1">Keterangan Tambahan</label>
                    <input type="text" class="var-opt2 w-full bg-black border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-white focus:border-gold-500 outline-none" placeholder="Cth: Indoor/Outdoor" value="${opt2}">
                </div>
                <div class="w-[45%] md:w-1/4">
                    <label class="block text-[9px] md:text-[10px] text-zinc-500 mb-1">Harga Opsi (Rp)</label>
                    <input type="number" class="var-hrg w-full bg-black border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-gold-400 font-bold focus:border-gold-500 outline-none" placeholder="0" value="${harga}" min="0" required>
                </div>
                <div class="w-[35%] md:w-[15%]">
                    <label class="block text-[9px] md:text-[10px] text-zinc-500 mb-1">Kuota/Stok</label>
                    <input type="number" class="var-stk w-full bg-black border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-white focus:border-gold-500 outline-none" placeholder="0" value="${stok}" min="0" required>
                </div>
                <div class="w-auto pb-0.5">
                    <button type="button" onclick="this.closest('.variant-row').remove()" class="bg-red-900/30 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/20 w-7 h-7 md:w-8 md:h-8 rounded-md flex items-center justify-center transition-colors shadow-sm" title="Hapus Opsi">
                        <i class="fa-solid fa-trash text-[10px]"></i>
                    </button>
                </div>
            `;
            container.appendChild(div);
        }

       
        async function fetchBerkas(force = false, silent = false) {
            if (!force && dataLoaded.berkas) return;
            try {
                const res = await fetch(`${SCRIPT_URL}?action=getBerkas&t=${new Date().getTime()}`);
                const data = await res.json();
                if (data.status === 'success') {
                    globalBerkas = data.data;
                    dataLoaded.berkas = true;
                }
            } catch (e) { }
        }

       
        async function initApp() {
            try {
                const updateProgress = (pct, text) => {
                    document.getElementById('loader-progress').style.width = pct + '%';
                    document.getElementById('loader-status').textContent = text;
                }

                updateProgress(10, 'Memeriksa Konfigurasi...');
                await fetchPengaturanAdmin(true, true);

                if (base64LogoDark && base64LogoDark.trim() !== "") {
                    document.getElementById('loader-logo-img').src = base64LogoDark;
                    document.getElementById('loader-logo-img').classList.remove('hidden');
                    document.getElementById('loader-default-icon').classList.add('hidden');
                } else if (base64LogoLight && base64LogoLight.trim() !== "") {
                    document.getElementById('loader-logo-img').src = base64LogoLight;
                    document.getElementById('loader-logo-img').classList.remove('hidden');
                    document.getElementById('loader-default-icon').classList.add('hidden');
                }

                updateProgress(30, 'Mengambil Summary...');
                await fetchDashboard(true, true);

                updateProgress(50, 'Menarik Database Layanan...');
                await fetchProduk(true, true);

               
                updateProgress(55, 'Memuat Data HNP...');
                await fetchCatatanHNP(true, true);

                updateProgress(65, 'Menarik Database Berkas Klien...');
                await fetchBerkas(true, true);

                updateProgress(80, 'Memuat Logistik Jadwal...');
                await fetchPenjualan(true, true);

                updateProgress(90, 'Memeriksa Identitas Klien...');
                await fetchPelanggan(true, true);

                updateProgress(85, 'Memuat Master Kru & Penugasan...');
                await fetchJadwalKru(true, true);

                updateProgress(30, 'Mengambil Summary...');
                await fetchDashboard(true, true);
                await fetchHistory(); 

                updateProgress(100, 'Memulai...');
                switchTab('dashboard');

                setTimeout(() => {
                    const loader = document.getElementById('full-page-loader');
                    loader.classList.add('opacity-0');
                    setTimeout(() => loader.remove(), 700);
                }, 500);
            } catch (err) {
                document.getElementById('loader-status').textContent = "Gagal memuat. Refresh halaman.";
            }
        }

       
        function toggleMobileNav() {
            const nav = document.getElementById('mobile-nav-container');
            const fab = document.getElementById('fab-menu');
            const icon = document.getElementById('fab-icon');

            if (!navVisible) {
                nav.classList.replace('translate-y-full', 'translate-y-0');
                icon.className = "fa-solid fa-chevron-down text-xl transition-transform duration-300";
                fab.classList.replace('bottom-6', 'bottom-[96px]');
            } else {
                nav.classList.replace('translate-y-0', 'translate-y-full');
                icon.className = "fa-solid fa-bars text-xl transition-transform duration-300";
                fab.classList.replace('bottom-[96px]', 'bottom-6');
            }
            navVisible = !navVisible;
        }

        function toggleDesktopSidebar() {
            const sidebar = document.getElementById('desktop-sidebar');
            if (desktopSidebarVisible) {
                sidebar.classList.add('sidebar-collapsed');
            } else {
                sidebar.classList.remove('sidebar-collapsed');
            }
            desktopSidebarVisible = !desktopSidebarVisible;
        }

        function updateNavTitles(tab) {
            const titles = {
                'dashboard': 'Dashboard',
                'produk': 'Katalog Paket',
                'hnp': 'Jadwal HNP',
                'penjualan': 'Jadwal Booking',
                'transkrip': 'Laporan Terselenggara',
                'pelanggan': 'Klien',
                'pengaturan': 'Konfigurasi'
            };
            document.getElementById('page-title').textContent = titles[tab];
        }

        function switchTab(tab) {
            const sections = ['dashboard', 'produk', 'penjualan', 'transkrip', 'pelanggan', 'pengaturan', 'vendor', 'jadwal', 'hnp'];

            sections.forEach(n => {
                document.getElementById(`sec-${n}`).classList.add('hidden');
                document.getElementById(`nav-${n}`).className = "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-zinc-400 hover:bg-zinc-800 hover:text-gold-400 font-semibold transition-all active:scale-95 whitespace-nowrap";
                const mobEl = document.getElementById(`nav-mob-${n}`);
                if (mobEl) {
                    mobEl.className = "flex flex-col items-center justify-center gap-1.5 p-2 text-zinc-500 hover:text-gold-400 min-w-[72px] shrink-0 active:scale-90 transition-transform";
                }
            });

            document.getElementById(`sec-${tab}`).classList.remove('hidden');
            document.getElementById(`nav-${tab}`).className = "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gold-500 text-black font-bold transition-all shadow-md shadow-gold-900/20 active:scale-95 whitespace-nowrap";

            const mobActive = document.getElementById(`nav-mob-${tab}`);
            if (mobActive) {
                mobActive.className = "flex flex-col items-center justify-center gap-1.5 p-2 text-gold-500 min-w-[72px] shrink-0 active:scale-90 transition-transform drop-shadow-sm";
            }

            updateNavTitles(tab);

            if (tab === 'dashboard') { 
                fetchDashboard(); 
                fetchHistory(); 
            }
            if (tab === 'produk') fetchProduk();
            if (tab === 'penjualan') fetchPenjualan();
            if (tab === 'transkrip') renderGridTranskrip();
            if (tab === 'pelanggan') fetchPelanggan();
            if (tab === 'pengaturan') fetchPengaturanAdmin();
            if (tab === 'hnp') renderKalenderHNP();
            
        }

        function toggleAutoSync() {
            const isEnabled = document.getElementById('auto-sync-toggle').checked;
            if (isEnabled) {
                syncInterval = setInterval(syncAllDataSilently, 15000);
            } else {
                clearInterval(syncInterval);
            }
        }

        async function syncAllDataSilently() {
            const syncIcon = document.getElementById('sync-icon');
            if (syncIcon) syncIcon.classList.add('fa-spin');

            await Promise.all([
                fetchDashboard(true, true),
                fetchProduk(true, true),
                fetchBerkas(true, true),
                fetchPenjualan(true, true),
                fetchPelanggan(true, true),
                fetchCatatanHNP(true, true),
                fetchJadwalKru(true, true)

            ]);

            if (syncIcon) syncIcon.classList.remove('fa-spin');
        }

      
        function renderDashboard() {
            if (dashData) {
                document.getElementById('dash-produk').textContent = dashData.totalProduk || 0;
                document.getElementById('dash-terjual').textContent = dashData.totalTerjual || 0;
                document.getElementById('dash-pendapatan').textContent = formatRp(dashData.totalPendapatan || 0);
            }
        }

        async function fetchDashboard(force = false, silent = false) {
            if (!force && dataLoaded.dashboard) { renderDashboard(); return; }
            if (!silent) showLoading(true);

            try {
                const res = await fetch(`${SCRIPT_URL}?action=getDashboard&t=${new Date().getTime()}`);
                const data = await res.json();

                if (data.status === 'success') {
                    dashData = data.data;
                    dataLoaded.dashboard = true;
                    renderDashboard();
                }
            } catch (err) {
                console.log(err);
            }

            if (!silent) showLoading(false);
        }

        function toggleModalDashDetail() {
            const modal = document.getElementById('modal-dash-detail');
            if (modal.classList.contains('opacity-0')) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                setTimeout(() => modal.classList.add('show'), 10);
            } else {
                modal.classList.remove('show');
                setTimeout(() => modal.classList.add('opacity-0', 'pointer-events-none'), 300);
            }
        }

        async function showDashDetail(type) {
            showLoading(true);
            if (type === 'produk' && (!dataLoaded.produk || globalProduk.length === 0)) await fetchProduk(true);
            else if ((type === 'terjual' || type === 'pendapatan') && (!dataLoaded.penjualan || globalPenjualan.length === 0)) await fetchPenjualan(true);
            showLoading(false);

            const titleEl = document.getElementById('dash-detail-title');
            const contentEl = document.getElementById('dash-detail-content');
            let contentHTML = '';

            if (type === 'produk') {
                titleEl.innerHTML = '<i class="fa-solid fa-layer-group text-blue-400 mr-2 text-base md:text-xl"></i> Sebaran Kategori Paket';
                const grouped = {};
                globalProduk.forEach(p => {
                    const kat = p.Kategori || p.kategori || 'Lainnya';
                    if (!grouped[kat]) grouped[kat] = [];
                    grouped[kat].push(p);
                });

                if (Object.keys(grouped).length === 0) {
                    contentHTML = '<p class="text-zinc-500 text-center py-8 text-sm">Belum ada data paket.</p>';
                } else {
                    for (const [kat, items] of Object.entries(grouped)) {
                        contentHTML += `
                        <div class="mb-4 md:mb-6 last:mb-0 bg-black p-3 md:p-4 rounded-xl md:rounded-2xl border border-zinc-800">
                            <h4 class="font-bold text-gold-500 text-sm md:text-base mb-2 md:mb-3 border-b border-zinc-800 pb-2 flex justify-between items-center">
                                <span>${kat}</span> <span class="bg-gold-500/10 text-gold-400 px-2 py-0.5 md:py-1 rounded text-[10px] md:text-xs">${items.length} Paket</span>
                            </h4>
                            <div class="space-y-2">`;
                        items.forEach(p => {
                            let namaPkt = p['Nama Paket WO'] || p['Nama Baju'] || p.nama;
                            let stok = p['Kuota Tersedia'] || p['Stok Total'] || p.Stok || p.stok;
                            let harga = p['Harga Base'] || p.Harga || p.harga;
                            contentHTML += `
                                <div class="bg-[#111] p-2.5 md:p-3 rounded-lg md:rounded-xl border border-zinc-800/50 flex justify-between items-center hover:border-gold-500/30 transition-colors gap-2">
                                    <div class="overflow-hidden">
                                        <p class="text-xs md:text-sm font-bold text-white truncate">${namaPkt}</p>
                                        <p class="text-[9px] md:text-[10px] text-zinc-500 font-mono mt-0.5 truncate">${p.ID || p.id}</p>
                                    </div>
                                    <div class="text-right shrink-0">
                                        <p class="text-[10px] md:text-xs text-zinc-400 mb-0.5">Sisa Kuota: <span class="font-bold ${stok <= 5 ? 'text-red-400' : 'text-emerald-400'}">${stok}</span></p>
                                        <p class="text-[11px] md:text-xs font-bold text-gold-400">${formatRp(harga)}</p>
                                    </div>
                                </div>`;
                        });
                        contentHTML += `</div></div>`;
                    }
                }
            } else if (type === 'terjual') {
                titleEl.innerHTML = '<i class="fa-solid fa-calendar-check text-emerald-400 mr-2 text-base md:text-xl"></i> Peminat Paket (Terjual)';
                const terjual = {};
                globalPenjualan.forEach(p => {
                    if (p['Status Acara'] === 'Dibatalkan' || p.Status === 'Dibatalkan') return;
                    const nama = p['Nama Paket'] || p['Nama Baju'];
                    if (!terjual[nama]) terjual[nama] = { qty: 0, total: 0 };
                    terjual[nama].qty += parseInt(p['Jumlah Pax/Item'] || p.Jumlah || 0);
                    terjual[nama].total += parseInt(p['Total Harga'] || 0);
                });
                const sorted = Object.entries(terjual).sort((a, b) => b[1].qty - a[1].qty);
                if (sorted.length === 0) {
                    contentHTML = '<p class="text-zinc-500 text-center py-8 text-sm">Belum ada booking yang sah.</p>';
                } else {
                    contentHTML = '<div class="space-y-2 md:space-y-3">';
                    sorted.forEach(([nama, data]) => {
                        contentHTML += `
                        <div class="bg-black p-3 md:p-4 rounded-xl md:rounded-2xl border border-zinc-800 flex justify-between items-center hover:bg-zinc-900 transition-colors gap-2">
                            <div class="flex-1 overflow-hidden">
                                <p class="text-xs md:text-sm font-bold text-white mb-1 truncate">${nama}</p>
                                <p class="text-[10px] md:text-xs text-gold-400 font-medium">Valuasi: ${formatRp(data.total)}</p>
                            </div>
                            <div class="text-right ml-2 shrink-0">
                                <p class="text-lg md:text-xl font-black text-emerald-400">${data.qty} <span class="text-[8px] md:text-[10px] font-normal text-zinc-500 uppercase block md:inline">Peminat</span></p>
                            </div>
                        </div>`;
                    });
                    contentHTML += '</div>';
                }
            } else if (type === 'pendapatan') {
                titleEl.innerHTML = '<i class="fa-solid fa-wallet text-gold-400 mr-2 text-base md:text-xl"></i> Aliran Dana';
                const validTrx = globalPenjualan.filter(p => p['Status Acara'] !== 'Dibatalkan' && p.Status !== 'Dibatalkan').sort((a, b) => new Date(b.Tanggal) - new Date(a.Tanggal));

                if (validTrx.length === 0) {
                    contentHTML = '<p class="text-zinc-500 text-center py-8 text-sm">Belum ada omzet masuk.</p>';
                } else {
                    contentHTML = '<div class="space-y-2 md:space-y-3">';
                    validTrx.forEach(p => {
                        let statAcara = p['Status Acara'] || p.Status;
                        let statusColor = statAcara === 'Diproses' || statAcara === 'Diskusi Lanjutan' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400';
                        if (statAcara === 'Menunggu Konfirmasi') statusColor = 'bg-orange-500/10 text-orange-400';
                        let nm = p['Nama Paket'] || p['Nama Baju'];
                        let user = p['Username Klien'] || p['Username Pembeli'];

                        contentHTML += `
                        <div class="bg-black p-3 md:p-4 rounded-xl md:rounded-2xl border border-zinc-800 flex justify-between items-center hover:bg-zinc-900 transition-colors gap-2">
                            <div class="w-7/12 md:w-2/3 pr-1 overflow-hidden">
                                <p class="text-[9px] md:text-[10px] font-mono text-zinc-500 mb-1 truncate"><i class="fa-regular fa-clock mr-1"></i> ${p.Tanggal}</p>
                                <p class="text-xs md:text-sm font-bold text-white truncate" title="${nm}">${nm}</p>
                                <p class="text-[9px] md:text-[11px] text-gold-500 mt-0.5 truncate">Klien: @${user} &bull; <span class="text-zinc-400 font-medium">${p['Metode Bayar'] || 'Transfer'}</span></p>
                            </div>
                            <div class="text-right w-5/12 md:w-1/3 shrink-0">
                                <p class="text-xs sm:text-sm md:text-base font-black text-gold-400 truncate">+ ${formatRp(p['Total Harga'])}</p>
                                <p class="text-[8px] md:text-[9px] px-1.5 md:px-2 py-0.5 md:py-1 rounded inline-block mt-1 font-bold ${statusColor}">${statAcara}</p>
                            </div>
                        </div>`;
                    });
                    contentHTML += '</div>';
                }
            }
            contentEl.innerHTML = contentHTML;
            toggleModalDashDetail();
        }

      
        function updateDatalistKategori() {
            const datalist = document.getElementById('list-kategori');
            let listKat = ["Pernikahan", "Lamaran", "Siraman", "Ulang Tahun"];

            if (globalProduk.length > 0) {
                globalProduk.forEach(p => {
                    const k = p.Kategori || p.kategori;
                    if (k && !listKat.includes(k)) listKat.push(k);
                });
            }
            datalist.innerHTML = listKat.map(k => `<option value="${k}">`).join('');
        }

        function toggleFormProduk() {
            const formContainer = document.getElementById('form-produk-container');
            if (formContainer.classList.contains('hidden')) {
                formContainer.classList.remove('hidden');
                formContainer.scrollIntoView({ behavior: "smooth" });
            } else {
                batalEditProduk();
                formContainer.classList.add('hidden');
            }
        }

        function toggleModalDetailProduk() {
            const modal = document.getElementById('modal-detail-produk');
            if (modal.classList.contains('opacity-0')) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                setTimeout(() => modal.classList.add('show'), 10);
            } else {
                modal.classList.remove('show');
                setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); }, 300);
            }
        }

        function bukaDetailProdukModal(id) {
            const p = globalProduk.find(x => x.ID == id || x.id == id);
            if (!p) return;

            const content = document.getElementById('content-detail-produk');
            const nm = p['Nama Paket WO'] || p['Nama Baju'] || p.nama;
            const kat = p.Kategori || p.kategori;
            const dsc = p.Deskripsi || 'Tidak ada deskripsi.';
            const gbrRaw = p['URL Gambar'] || '';
            const imgs = gbrRaw.split(',').filter(u => u.trim() !== "");
            const safeGbr = imgs[0] || 'https://via.placeholder.com/400';

            let imgHtml = `<img src="${safeGbr}" class="w-full h-40 sm:h-48 object-cover rounded-xl sm:rounded-2xl mb-3 sm:mb-4 border border-zinc-800">`;
            if (imgs.length > 1) {
                imgHtml += `<div class="flex gap-2 overflow-x-auto hide-scrollbar mb-3 sm:mb-4">` + imgs.map(u => `<img src="${u}" class="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-zinc-700 hover:border-gold-500">`).join('') + `</div>`;
            }

            let varListHTML = "";
            let varArr = [];
            try {
                if (p.Varian) varArr = JSON.parse(p.Varian);
            } catch (e) { }

            if (varArr.length > 0) {
                varListHTML = `<div class="mt-4"><p class="text-[10px] text-gold-500 font-bold uppercase mb-2">Opsi & Kapasitas (${varArr.length})</p><div class="space-y-1.5">`;
                varArr.forEach(v => {
                    let uk = v.opsi1 || v.ukuran;
                    let len = v.opsi2 || v.lengan;
                    varListHTML += `
                    <div class="flex justify-between items-center bg-black border border-zinc-800 p-2.5 rounded-lg">
                        <div>
                            <span class="text-[11px] sm:text-xs text-gold-400 font-bold">${uk}</span>
                            <span class="text-[9px] sm:text-[10px] text-zinc-400 block">${len}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-xs sm:text-sm text-white font-bold block">${formatRp(v.harga)}</span>
                            <span class="text-[9px] sm:text-[10px] text-zinc-500 font-medium mt-0.5 inline-block bg-[#111] px-1.5 rounded border border-zinc-800">Sisa Kuota: ${v.stok}</span>
                        </div>
                    </div>`;
                });
                varListHTML += `</div></div>`;
            } else {
                let hrgBase = p['Harga Base'] || p.Harga || p.harga;
                let stkTotal = p['Kuota Tersedia'] || p['Stok Total'] || p.Stok || p.stok;
                varListHTML = `
                <div class="flex justify-between items-center bg-black border border-zinc-800 p-2.5 sm:p-3 rounded-lg sm:rounded-xl mb-3 sm:mb-4">
                    <div><p class="text-[9px] sm:text-[10px] text-gold-600 font-bold uppercase">Nilai Paket</p><p class="text-white font-bold text-xs sm:text-sm">${formatRp(hrgBase)}</p></div>
                    <div class="text-right"><p class="text-[9px] sm:text-[10px] text-gold-600 font-bold uppercase">Total Kuota</p><p class="font-bold ${stkTotal <= 5 ? 'text-red-400' : 'text-emerald-400'} text-xs sm:text-sm">${stkTotal} Pax/Item</p></div>
                </div>`;
            }

            content.innerHTML = `
                ${imgHtml}
                <div class="flex justify-between items-start mb-2 gap-2">
                    <div class="overflow-hidden"><h4 class="font-bold text-base sm:text-lg text-gold-500 truncate">${nm}</h4><p class="font-mono text-[10px] sm:text-xs text-zinc-500">${id}</p></div>
                    <span class="bg-gold-500/10 text-gold-500 text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-md sm:rounded border border-gold-500/20 shrink-0 mt-0.5">${kat}</span>
                </div>
                <div><p class="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase mb-1 mt-2">Detail Fasilitas</p><p class="text-xs sm:text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">${dsc}</p></div>
                ${varListHTML}
            `;
            toggleModalDetailProduk();
        }

        async function fetchProduk(force = false, silent = false) {
            if (!force && dataLoaded.produk && globalProduk.length > 0) {
                renderTableProduk();
                return;
            }
            if (!silent) showLoading(true);

            try {
                const res = await fetch(`${SCRIPT_URL}?action=getProduk&t=${new Date().getTime()}`);
                const data = await res.json();
                if (data.status === 'success') {
                    globalProduk = data.data;
                    dataLoaded.produk = true;
                    updateDatalistKategori();
                    renderTableProduk();
                }
            } catch (err) { }

            if (!silent) showLoading(false);
        }

        function renderTableProduk() {
            const tbody = document.getElementById('table-produk');
            if (globalProduk.length > 0) {
                tbody.innerHTML = globalProduk.map(p => {
                    const id = p.ID || p.id;
                    const nm = p['Nama Paket WO'] || p['Nama Baju'] || p.nama;
                    const kat = p.Kategori || p.kategori;
                    const hrgBase = p['Harga Base'] || p.Harga || p.harga || 0;
                    const stkTotal = p['Kuota Tersedia'] || p['Stok Total'] || p.Stok || p.stok || 0;
                    const gbr = p['URL Gambar'] || '';
                    const safeGbr = (gbr.split(',')[0]) || 'https://via.placeholder.com/50/000000/D4AF37?text=NO+IMG';

                    let varianArr = [];
                    let dispHarga = formatRp(hrgBase);

                    try {
                        if (p.Varian) varianArr = JSON.parse(p.Varian);
                    } catch (e) { }

                    if (varianArr.length > 1) {
                        const min = Math.min(...varianArr.map(v => v.harga));
                        const max = Math.max(...varianArr.map(v => v.harga));
                        if (min !== max) {
                            dispHarga = `<span class="text-[9px] text-zinc-500 block">Start from</span>${formatRp(min)}`;
                        } else {
                            dispHarga = formatRp(min);
                        }
                    } else if (varianArr.length === 1) {
                        dispHarga = formatRp(varianArr[0].harga);
                    }

                    return `
                    <tr class="hover:bg-zinc-900 border-b border-zinc-800/50 cursor-pointer" onclick="bukaDetailProdukModal('${id}')">
                        <td class="px-3 md:px-5 py-2.5 md:py-3"><img src="${safeGbr}" class="w-8 h-8 md:w-10 md:h-10 object-cover rounded-lg md:rounded-[10px] shadow-sm border border-zinc-700"></td>
                        <td class="px-3 md:px-5 py-2.5 md:py-3 max-w-[120px] md:max-w-[200px] truncate"><span class="font-bold text-white text-xs md:text-sm block truncate group-hover:text-gold-500">${nm}</span><span class="font-mono text-zinc-500 text-[9px] md:text-[10px] block truncate">${id} &bull; ${kat}</span></td>
                        <td class="px-3 md:px-5 py-2.5 md:py-3 font-bold text-gold-400 text-xs md:text-sm leading-tight">${dispHarga}</td>
                        <td class="px-3 md:px-5 py-2.5 md:py-3 text-center font-bold text-xs md:text-sm ${stkTotal <= 5 ? 'text-red-400' : 'text-zinc-200'}">${stkTotal}</td>
                        <td class="px-3 md:px-5 py-2.5 md:py-3 text-center" onclick="event.stopPropagation()">
                            <div class="flex gap-1 md:gap-2 justify-center">
                                <button type="button" onclick="mulaiEditProduk('${id}')" class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-900/30 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-colors"><i class="fa-solid fa-pen text-[10px] md:text-xs"></i></button>
                                <button type="button" onclick="hapusProduk('${id}')" class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-red-900/30 text-red-400 border border-red-500/20 hover:bg-red-600 hover:text-white transition-colors"><i class="fa-solid fa-trash text-[10px] md:text-xs"></i></button>
                            </div>
                        </td>
                    </tr>`
                }).join('');
            } else {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 md:py-12 text-zinc-500 font-medium text-xs md:text-sm">Belum ada paket layanan.</td></tr>`;
            }
        }

        function previewImageMultiple(event) {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            document.getElementById('upload-placeholder').classList.add('hidden');
            const container = document.getElementById('p-gambar-preview-container');
            container.classList.remove('hidden');
            base64GambarArray = [];
            container.innerHTML = '';

            Array.from(files).forEach((file) => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = new Image();
                    img.onload = function () {
                        const canvas = document.createElement('canvas');
                        const MAX_SIZE = 1000;
                        let w = img.width;
                        let h = img.height;

                        if (w > h && w > MAX_SIZE) {
                            h *= MAX_SIZE / w; w = MAX_SIZE;
                        } else if (h > MAX_SIZE) {
                            w *= MAX_SIZE / h; h = MAX_SIZE;
                        }

                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, w, h);

                       
                        let imageFormat = 'image/jpeg';
                        if (targetVarBase64.includes('Logo')) {
                            imageFormat = 'image/png'; 
                        }

                      
                        const b64 = canvas.toDataURL(imageFormat, 0.85);
                        base64GambarArray.push(b64);
                        container.innerHTML += `<img src="${b64}" class="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg md:rounded-xl shadow-sm shrink-0 border border-gold-500/30">`;
                    }
                    img.src = e.target.result;
                }
                reader.readAsDataURL(file);
            });
        }

        function mulaiEditProduk(id) {
            const p = globalProduk.find(x => x.ID == id || x.id == id);
            if (!p) return;

            isEditingProduk = true;
            produkIdToEdit = id;
            document.getElementById('title-form-produk').innerHTML = `<div class="w-6 h-6 md:w-7 md:h-7 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center text-[10px] md:text-xs"><i class="fa-solid fa-pen"></i></div><span class="text-blue-400">Edit Paket: ${id}</span>`;
            document.getElementById('btn-batal-edit').classList.remove('hidden');
            document.getElementById('form-produk-container').classList.remove('hidden');

            document.getElementById('p-id').value = id;
            document.getElementById('p-id').disabled = true;
            document.getElementById('p-id').classList.add('opacity-50', 'cursor-not-allowed');
            document.getElementById('p-nama').value = p['Nama Paket WO'] || p['Nama Baju'] || p.nama;
            document.getElementById('p-kategori').value = p.Kategori || p.kategori;
            document.getElementById('p-deskripsi').value = p.Deskripsi ? p.Deskripsi.replace(/\\n/g, '\n') : "";

            document.getElementById('variant-container').innerHTML = '';

            let varianArr = [];
            try {
                if (p.Varian) varianArr = JSON.parse(p.Varian);
            } catch (e) { }

            if (varianArr.length === 0) {
                addVariantRow('-', 'Standard', p['Harga Base'] || 0, p['Kuota Tersedia'] || p['Stok Total'] || 0);
            } else {
                varianArr.forEach(v => {
                    addVariantRow(v.opsi1 || v.ukuran, v.opsi2 || v.lengan, v.harga, v.stok);
                });
            }

            let gbrRaw = p['URL Gambar'] || '';
            base64GambarArray = gbrRaw ? gbrRaw.split(',') : [];
            const container = document.getElementById('p-gambar-preview-container');

            if (base64GambarArray.length > 0 && base64GambarArray[0] !== "") {
                document.getElementById('upload-placeholder').classList.add('hidden');
                container.classList.remove('hidden');
                container.innerHTML = base64GambarArray.map(url => `<img src="${url}" class="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg md:rounded-xl shadow-sm shrink-0 border border-gold-500/30">`).join('');
            } else {
                container.classList.add('hidden');
                container.innerHTML = '';
                document.getElementById('upload-placeholder').classList.remove('hidden');
            }

            const btnSubmit = document.getElementById('btn-submit-produk');
            btnSubmit.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Perbarui Katalog`;
            btnSubmit.className = "bg-blue-600 text-white hover:bg-blue-500 px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-full font-bold transition-colors w-full sm:w-auto text-sm md:text-base";
            document.getElementById('form-produk-container').scrollIntoView({ behavior: "smooth" });
        }

        function batalEditProduk() {
            isEditingProduk = false;
            produkIdToEdit = null;
            document.getElementById('title-form-produk').innerHTML = `<div class="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center text-[10px] md:text-xs"><i class="fa-solid fa-plus"></i></div><span>Tambah Paket Baru</span>`;
            document.getElementById('btn-batal-edit').classList.add('hidden');
            document.getElementById('p-id').disabled = false;
            document.getElementById('p-id').classList.remove('opacity-50', 'cursor-not-allowed');
            document.getElementById('form-produk').reset();
            document.getElementById('variant-container').innerHTML = '';
            addVariantRow();

            base64GambarArray = [];
            document.getElementById('p-gambar-preview-container').classList.add('hidden');
            document.getElementById('p-gambar-preview-container').innerHTML = '';
            document.getElementById('upload-placeholder').classList.remove('hidden');

            const btnSubmit = document.getElementById('btn-submit-produk');
            btnSubmit.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Simpan Paket`;
            btnSubmit.className = "bg-gradient-to-r from-gold-600 to-gold-400 text-black px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-full font-extrabold shadow-lg shadow-gold-500/20 w-full sm:w-auto text-sm md:text-base transition-all";
            document.getElementById('form-produk-container').classList.add('hidden');
        }

        async function handleSaveProduk(e) {
            e.preventDefault();
            let varianData = [];
            let minHarga = Infinity;
            let totalStok = 0;
            const rows = document.querySelectorAll('.variant-row');

            rows.forEach(r => {
                let h = parseInt(r.querySelector('.var-hrg').value) || 0;
                let s = parseInt(r.querySelector('.var-stk').value) || 0;
                varianData.push({ opsi1: r.querySelector('.var-opt1').value.trim(), opsi2: r.querySelector('.var-opt2').value, harga: h, stok: s });
                if (h < minHarga) minHarga = h;
                totalStok += s;
            });

            if (varianData.length === 0) {
                alert('Harap tambahkan minimal 1 opsi!');
                return;
            }
            if (minHarga === Infinity) minHarga = 0;

            const btn = document.getElementById('btn-submit-produk');
            const ogText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Proses...';
            btn.disabled = true;

            const payload = {
                action: isEditingProduk ? "editProduk" : "addProduk",
                id: document.getElementById('p-id').value,
                nama: document.getElementById('p-nama').value,
                kategori: document.getElementById('p-kategori').value,
                harga: minHarga,
                stok: totalStok,
                gambar: base64GambarArray.join('|'),
                deskripsi: document.getElementById('p-deskripsi').value,
                varian: varianData
            };

            try {
               const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain' }});
                const data = await res.json();
                if (data.status === 'success') {
                    alert(data.message);
                    batalEditProduk();
                    fetchProduk(true);
                } else {
                    alert('Gagal: ' + data.message);
                }
            } catch (err) {
                alert('Kesalahan jaringan!');
            }

            btn.innerHTML = ogText;
            btn.disabled = false;
        }

        async function hapusProduk(id) {
            if (!confirm(`Hapus paket ID: ${id}?`)) return;
            showLoading(true);

            try {
                const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "deleteProduk", id: id }), headers: { 'Content-Type': 'text/plain' } });
                const data = await res.json();
                if (data.status === 'success') fetchProduk(true);
            } catch (e) { }

            showLoading(false);
        }

       
        function getBulanTahun(tglStr) {
            if (!tglStr) return "Lama";
            try {
                const parts = tglStr.split(',')[0].split('/');
                if (parts.length >= 3) {
                    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
                    let idxBulan = parseInt(parts[1]) - 1;
                    if (parseInt(parts[1]) > 12) idxBulan = parseInt(parts[0]) - 1;
                    return `${months[idxBulan]} ${parts[2]}`;
                }
            } catch (e) { }
            return "Lainnya";
        }

        async function fetchPenjualan(force = false, silent = false) {
            if (!force && dataLoaded.penjualan && globalPenjualan.length > 0) { renderFilterBulan(); renderTabelPenjualan(activeBulanFilter); renderKalender(); return; }
            if (!silent) showLoading(true);
            try {
                const [resPenjualan, resBerkas] = await Promise.all([
                    fetch(`${SCRIPT_URL}?action=getPenjualan&t=${new Date().getTime()}`),
                    fetch(`${SCRIPT_URL}?action=getBerkas&t=${new Date().getTime()}`)
                ]);
                const data = await resPenjualan.json();
                const dataBerkas = await resBerkas.json();

                if (data.status === 'success') {
                    globalPenjualan = data.data.reverse();
                    if (dataBerkas.status === 'success') globalBerkas = dataBerkas.data;
                    dataLoaded.penjualan = true;
                    renderFilterBulan(); renderTabelPenjualan(activeBulanFilter); renderGridTranskrip(); renderKalender();
                }
            } catch (err) { }
            if (!silent) showLoading(false);
        }

        function renderFilterBulan() {
            const container = document.getElementById('filter-bulan-container');
            let listBulan = [...new Set(globalPenjualan.map(p => getBulanTahun(p.Tanggal)))];
            if (!listBulan.includes(activeBulanFilter) && activeBulanFilter !== 'Semua Waktu') {
                activeBulanFilter = 'Semua Waktu';
            }
            
            
            let totalSemua = globalPenjualan.length;
            let badgeSemua = totalSemua > 0 ? `<div class="absolute -top-1.5 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] md:text-[9px] font-bold shadow-md border border-black">${totalSemua}</div>` : '';

            let html = `<button onclick="setBulanFilter('Semua Waktu')" class="shrink-0 relative px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all border ${activeBulanFilter === 'Semua Waktu' ? 'bg-gold-500 text-black border-gold-500 shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'bg-[#111] text-zinc-400 border-zinc-800 hover:border-gold-500/50'}">Semua${badgeSemua}</button>`;

            listBulan.forEach(bln => {
               
                let count = globalPenjualan.filter(p => getBulanTahun(p.Tanggal) === bln).length;
                let badge = count > 0 ? `<div class="absolute -top-1.5 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] md:text-[9px] font-bold shadow-md border border-black">${count}</div>` : '';

                const activeClass = (activeBulanFilter === bln) ? 'bg-gold-500 text-black border-gold-500 shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'bg-[#111] text-zinc-400 border-zinc-800 hover:border-gold-500/50';
                
             
                html += `<button onclick="setBulanFilter('${bln}')" class="shrink-0 relative px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all border ${activeClass}">${bln}${badge}</button>`;
            });
            container.innerHTML = html;
        }

        function setBulanFilter(bulan) {
            activeBulanFilter = bulan;
            document.getElementById('label-bulan-aktif').textContent = bulan === 'Semua Waktu' ? 'Semua' : bulan;
            renderFilterBulan();
            renderTabelPenjualan(bulan);
        }

        function renderTabelPenjualan(bulanFilter) {
            const tbody = document.getElementById('table-penjualan');
            let dataTampil = globalPenjualan;
            if (bulanFilter !== 'Semua Waktu') { dataTampil = globalPenjualan.filter(p => getBulanTahun(p.Tanggal) === bulanFilter); }

            const searchInput = document.getElementById('search-booking');
            if (searchInput) {
                const query = searchInput.value.toLowerCase().trim();
                if (query !== "") {
                    dataTampil = dataTampil.filter(p => {
                        const idStr = String(p['ID Booking'] || p['ID Transaksi'] || "").toLowerCase();
                        const klienStr = String(p['Username Klien'] || p['Username Pembeli'] || "").toLowerCase();
                        const pktStr = String(p['Nama Paket'] || p['Nama Baju'] || "").toLowerCase();
                        const detailStr = String(p['Detail Pilihan'] || p['Varian Detail'] || "").toLowerCase();
                        return idStr.includes(query) || klienStr.includes(query) || pktStr.includes(query) || detailStr.includes(query);
                    });
                }
            }

            if (dataTampil.length > 0) {
                tbody.innerHTML = dataTampil.map(p => {
                    const idTrx = p['ID Booking'] || p['ID Transaksi']; const statusAcara = p['Status Acara'] || p.Status || "Menunggu Konfirmasi"; const isDP = p['Tipe Pembayaran'] === 'DP'; const isCustomUnpriced = (p['ID Paket'] === 'CUSTOM' || p['ID Baju'] === 'CUSTOM') && parseInt(p['Total Harga']) === 0; const nmPkt = p['Nama Paket'] || p['Nama Baju']; const clientNm = p['Username Klien'] || p['Username Pembeli']; const qtyP = p['Jumlah Pax/Item'] || p.Jumlah;
                    let statBayarList = p['Status Pembayaran'] || ''; let isLunas = statBayarList.includes('Lunas');
                    let metodeBayarAwalList = p['Metode Bayar'] || 'Transfer'; let metodeDisplay1List = metodeBayarAwalList;
                    if (statBayarList.includes('Belum DP (Cash)') || statBayarList.includes('Sudah DP (Cash)')) metodeDisplay1List = 'Cash'; else if (statBayarList.includes('Sudah DP (TRANSFER/QRIS)')) metodeDisplay1List = 'QRIS'; else if (statBayarList.includes('Lunas (QRIS)') && !isDP) metodeDisplay1List = 'QRIS'; else if (statBayarList.includes('Lunas (Cash)') && !isDP) metodeDisplay1List = 'Cash';

                    let badgeColor = statusAcara === 'Diproses' || statusAcara === 'Diskusi Lanjutan' ? "bg-blue-900/30 border border-blue-500/20 text-blue-400" : (statusAcara === 'Selesai' ? "bg-emerald-900/30 border border-emerald-500/20 text-emerald-400" : (statusAcara === 'Dibatalkan' ? "bg-red-900/30 border border-red-500/20 text-red-400" : "bg-orange-900/30 border border-orange-500/20 text-orange-400"));
                    const bayarBadge = isDP ? "bg-purple-900/30 text-purple-400 border border-purple-500/20" : "bg-emerald-900/30 text-emerald-400 border border-emerald-500/20";

                    let varDetailHtml = "";
                    try { const varObj = JSON.parse(p['Detail Pilihan'] || p['Varian Detail']); if (Array.isArray(varObj)) { varDetailHtml = `<div class="flex flex-wrap gap-1 mt-1">` + varObj.map(v => `<span class="bg-zinc-800 text-zinc-300 border border-zinc-700 px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-bold whitespace-nowrap">${v.opsi1 || v.ukuran}-${v.opsi2 || v.lengan}(${v.jumlah})</span>`).join('') + `</div>`; } else if (varObj.opsi1 || varObj.ukuran) { varDetailHtml = `<span class="bg-zinc-800 text-zinc-300 border border-zinc-700 px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-bold block mt-1 w-max">${varObj.opsi1 || varObj.ukuran} - ${varObj.opsi2 || varObj.lengan}</span>`; } } catch (e) { }

                   
                    const berkas = globalBerkas.find(b => b['ID Booking'] === idTrx);
                    let upgradeBadge = '';
                    if (berkas && berkas['Data Upgrade'] && berkas['Data Upgrade'] !== '[]' && berkas['Data Upgrade'] !== '') {
                        upgradeBadge = `<span class="bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded ml-1 uppercase align-middle shadow-sm">Upgraded <i class="fa-solid fa-arrow-up text-[7px]"></i></span>`;
                    }

                    const fileDesign = (p['File Konsep'] || p['File Desain']) ? `<a href="${p['File Konsep'] || p['File Desain']}" target="_blank" class="bg-indigo-900/30 text-indigo-400 hover:bg-indigo-600 hover:text-white px-2 py-1 rounded-lg text-[9px] md:text-[10px] font-bold border border-indigo-500/20 active:scale-95 transition-colors mt-1 inline-block"><i class="fa-solid fa-file-pdf"></i> Konsep</a>` : '';

                    let bukti1 = `<span class="text-[9px] md:text-[10px] text-zinc-600 font-medium italic">No Struk</span>`;
                    if (p['Bukti Pembayaran'] && p['Bukti Pembayaran'] !== "Bayar Cash" && p['Bukti Pembayaran'] !== "Bayar Cash di Kantor" && p['Bukti Pembayaran'] !== "-") {
                        bukti1 = `<button onclick="bukaBuktiModal('${p['Bukti Pembayaran']}')" class="bg-zinc-800 text-gold-500 hover:bg-gold-500 hover:text-black border border-gold-500/30 px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold transition-colors"><i class="fa-solid fa-image"></i> Awal</button>`;
                    }

                    let bukti2 = `<span class="text-[9px] md:text-[10px] text-zinc-700">-</span>`;
                    if (isDP) { if (p['Bukti Pelunasan'] && p['Bukti Pelunasan'].startsWith('http')) { bukti2 = `<button onclick="bukaBuktiModal('${p['Bukti Pelunasan']}')" class="bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold transition-colors"><i class="fa-solid fa-image"></i> Lunas</button>`; } else { bukti2 = `<span class="text-[8px] md:text-[9px] text-orange-400 font-bold bg-orange-900/30 border border-orange-500/20 px-1.5 md:px-2 py-0.5 md:py-1 rounded">Pending</span>`; } }

                    let hargaTampil = formatRp(p['Total Harga']);
                    if (isCustomUnpriced) hargaTampil = `<button onclick="bukaModalHarga('${idTrx}')" class="bg-gold-600 text-black px-2 py-1 rounded text-[9px] font-bold hover:bg-gold-500 transition-colors shadow-md">Input Penawaran</button>`;

                  
                    let btnWaHtml = "";
                    const dataKlien = globalPelanggan.find(k => k.Username === clientNm);
                    if (dataKlien && dataKlien['No HP']) {
                        let rawHp = String(dataKlien['No HP']).replace(/\D/g, '');
                        if (rawHp.startsWith('0')) rawHp = '62' + rawHp.substring(1);
                        else if (rawHp.startsWith('8')) rawHp = '62' + rawHp;
                        
                        let pesanWa = encodeURIComponent(`Halo Kak ${dataKlien['Nama Lengkap']},\nKami dari *Elegance WO* ingin mengkonfirmasi detail pesanan dengan ID Booking: *${idTrx}*.\n\nMohon waktunya sebentar ya Kak untuk diskusi. Terima kasih 🙏`);
                        btnWaHtml = `<a href="https://wa.me/${rawHp}?text=${pesanWa}" target="_blank" onclick="event.stopPropagation()" class="ml-1.5 inline-flex items-center justify-center w-5 h-5 bg-[#25D366] text-white rounded-full hover:scale-110 transition shadow-[0_0_8px_rgba(37,211,102,0.4)]" title="Hubungi Klien via WA"><i class="fa-brands fa-whatsapp text-[11px]"></i></a>`;
                    }
                   

                    return `
                    <tr class="hover:bg-zinc-900 border-b border-zinc-800/50">
                        <td class="px-3 md:px-5 py-2.5 md:py-3 cursor-pointer" onclick="bukaDetailPesananModal('${idTrx}')">
                            <span class="font-mono font-bold text-gold-500 block text-[10px] md:text-[11px]">${idTrx}</span>
                            <div class="flex items-center mt-0.5 md:mt-1">
                                <span class="text-[9px] md:text-[10px] text-zinc-300 truncate max-w-[100px] md:max-w-[130px]"><i class="fa-regular fa-user text-zinc-500 mr-1"></i>${clientNm || '-'}</span>
                                ${btnWaHtml}
                            </div>
                            <span class="text-[8px] md:text-[9px] text-zinc-600 block mt-0.5">${p.Tanggal.split(' ')[0]}</span>
                        </td>
                        <td class="px-3 md:px-5 py-2.5 md:py-3 cursor-pointer" onclick="bukaDetailPesananModal('${idTrx}')"><p class="font-bold text-white text-[10px] md:text-[11px] w-28 md:w-40 truncate" title="${nmPkt}">${nmPkt} ${upgradeBadge}</p>${varDetailHtml}</td>
                        <td class="px-3 md:px-5 py-2.5 md:py-3 cursor-pointer" onclick="bukaDetailPesananModal('${idTrx}')"><p class="text-gold-400 font-extrabold text-[10px] md:text-[11px] mt-0.5 md:mt-1">${hargaTampil}</p><p class="text-[8px] md:text-[9px] text-zinc-500 font-normal mt-0.5">${qtyP} Pax/Item</p></td>
                        <td class="px-3 md:px-5 py-2.5 md:py-3 text-center"><span class="px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[8px] md:text-[9px] font-bold uppercase bg-zinc-800 text-zinc-300 block mb-0.5 md:mb-1 border border-zinc-700">${metodeDisplay1List}</span><span class="px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[8px] md:text-[9px] font-bold uppercase ${bayarBadge} block mb-1" title="${p['Detail DP'] || ''}">${p['Tipe Pembayaran']}</span>${fileDesign}</td>
                        <td class="px-3 md:px-5 py-2.5 md:py-3 text-center" onclick="event.stopPropagation()">
                            <select onchange="updateDBStatus('${idTrx}', 'pembayaran', this.value)" class="w-full min-w-[90px] bg-black border border-zinc-700 text-gold-500 text-[9px] md:text-[10px] font-bold rounded px-1 py-1.5 outline-none text-center cursor-pointer mb-1 focus:border-gold-500"><option value="${statBayarList}" hidden selected>${statBayarList || 'Status'}</option><option value="Belum Bayar">Belum Bayar</option><option value="Belum DP (Cash)">Belum DP (Cash)</option><option value="Sudah DP (QRIS)">Sudah DP (QRIS)</option><option value="Sudah DP (Cash)">Sudah DP (Cash)</option><option value="Lunas (QRIS)">Lunas (QRIS)</option><option value="Lunas (Cash)">Lunas (Cash)</option></select>
                            <div class="flex justify-center gap-1 mt-1">${bukti1} ${bukti2}</div>
                        </td>
                        <td class="px-3 md:px-5 py-2.5 md:py-3 text-center" onclick="event.stopPropagation()">
                            <span class="px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[8px] md:text-[9px] font-bold w-full min-w-[90px] text-center inline-block mb-1 ${badgeColor}">${statusAcara}</span>
                            <select onchange="updateDBStatus('${idTrx}', 'pesanan', this.value)" class="w-full min-w-[90px] bg-zinc-800 border border-zinc-700 text-white text-[8px] md:text-[9px] font-bold rounded px-1 py-1 md:py-1.5 outline-none text-center cursor-pointer hover:border-gold-500"><option value="" disabled selected>Update Acara</option><option value="Menunggu Estimasi Harga">Estimasi Biaya</option><option value="Menunggu Pembayaran">Menunggu Bayar</option><option value="Menunggu Konfirmasi">Cek Bukti</option><option value="Diskusi Lanjutan">Diskusi Lanjut</option><option value="Diproses">Acara Diproses</option><option value="Selesai">Acara Selesai</option><option value="Dibatalkan">Batal</option></select>
                            <button onclick="bukaEditBerkasAdmin('${idTrx}')" class="w-full mt-1.5 bg-indigo-900/30 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 font-bold py-1.5 rounded text-[9px] md:text-[10px] transition-colors flex items-center justify-center gap-1 shadow-sm"><i class="fa-solid fa-folder-open"></i> Berkas</button>
                            <button onclick="hapusBooking('${idTrx}')" class="w-full mt-1.5 bg-red-900/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 font-bold py-1.5 rounded text-[9px] md:text-[10px] transition-colors flex items-center justify-center gap-1 shadow-sm"><i class="fa-solid fa-trash"></i> Hapus</button>
                        </td>

                    </tr>`
                }).join('');
            } else { tbody.innerHTML = `<tr><td colspan="6" class="py-10 md:py-12 text-center text-zinc-600 font-medium text-xs md:text-sm">Data tidak ditemukan.</td></tr>`; }
        }

        function toggleAbUpgradeArea() {
            const isChecked = document.getElementById('ab-is-upgrade').checked;
            const area = document.getElementById('area-ab-upgrade-paket');
            if (isChecked) {
                area.classList.remove('hidden'); if (document.getElementById('list-ab-upgrade-paket').children.length === 0) addAbUpgradeRow();
            } else { area.classList.add('hidden'); }
        }

        function addAbUpgradeRow(nama = '', qty = 1, harga = '') {
            const container = document.getElementById('list-ab-upgrade-paket');
            const div = document.createElement('div');
            div.className = 'upg-ab-row flex gap-2 items-center bg-black p-2 rounded-lg border border-zinc-700';
            div.innerHTML = `
                <input type="text" class="upg-ab-nama flex-1 w-1/3 bg-transparent text-white text-xs outline-none px-2" placeholder="Nama Upgrade" value="${nama}">
                <div class="w-px h-4 bg-zinc-700"></div>
                <input type="number" class="upg-ab-qty w-12 bg-transparent text-white text-xs text-center outline-none" placeholder="Qty" value="${qty}" min="1">
                <div class="w-px h-4 bg-zinc-700"></div>
                <input type="number" class="upg-ab-hrg w-24 bg-transparent text-gold-400 font-bold text-xs outline-none px-2" placeholder="Harga/item" value="${harga}">
                <button type="button" onclick="this.parentElement.remove()" class="text-zinc-500 hover:text-red-500 w-6 h-6 flex items-center justify-center"><i class="fa-solid fa-times text-[10px]"></i></button>
            `;
            container.appendChild(div);
        }

        async function updateDBStatus(id, type, val) {
            showLoading(true);
            const payload = { action: "updateStatus", id_transaksi: id };

            if (type === 'pembayaran') payload.status_pembayaran = val;
            if (type === 'pesanan') payload.status_pesanan = val;

            try {
               const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain' } });
                const data = await res.json();

                if (data.status === 'success') {
                    const trx = globalPenjualan.find(p => (p['ID Booking'] || p['ID Transaksi']) === id);
                    if (trx) {
                        if (type === 'pembayaran') {
                            trx['Status Pembayaran'] = val;
                        }
                        if (type === 'pesanan') {
                            if (trx['Status Acara']) {
                                trx['Status Acara'] = val;
                            } else {
                                trx.Status = val;
                            }
                        }
                    }
                    renderTabelPenjualan(activeBulanFilter);
                    fetchDashboard(true, true);
                } else {
                    alert('Gagal: ' + data.message);
                }
            } catch (e) {
                alert('Terjadi kesalahan koneksi.');
            }
            showLoading(false);
        }

        
        let globalHistory = [];
        
        async function fetchHistory() {
            try {
                const res = await fetch(`${SCRIPT_URL}?action=getHistory&t=${new Date().getTime()}`);
                const data = await res.json();
                if (data.status === 'success') {
                    globalHistory = data.data;
                    renderHistory();
                }
            } catch(e) {}
        }

        function renderHistory() {
            const container = document.getElementById('list-history');
            if(globalHistory.length === 0) {
                container.innerHTML = '<p class="text-center text-zinc-600 text-xs py-4">Belum ada aktivitas tercatat.</p>';
                return;
            }
            container.innerHTML = globalHistory.map(h => `
                <div class="flex items-start gap-3 bg-black p-3 rounded-xl border border-zinc-800/50 hover:border-gold-500/30 transition-colors">
                    <div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gold-500/10 text-gold-500 flex items-center justify-center shrink-0 border border-gold-500/20"><i class="fa-solid fa-bolt text-[10px]"></i></div>
                    <div>
                        <p class="text-[9px] md:text-[10px] text-zinc-500 font-mono mb-0.5">${h.waktu}</p>
                        <p class="text-[11px] md:text-xs text-zinc-300 font-medium leading-tight">${h.teks}</p>
                    </div>
                </div>
            `).join('');
        }

       
        async function hapusBooking(idTrx) {
            if (event) event.stopPropagation(); 
            if (!confirm(`PERINGATAN BAHAYA:\n\nApakah Anda yakin ingin MENGHAPUS PERMANEN Data Booking dengan ID: ${idTrx}?\nTindakan ini tidak dapat dikembalikan!`)) return;
            
            showLoading(true);
            try {
                const payload = { action: "deleteBooking", id_transaksi: idTrx };
                const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload),headers: { 'Content-Type': 'text/plain' } });
                const data = await res.json();
                
                if (data.status === 'success') {
                    alert(data.message);
                    fetchPenjualan(true, false); 
                    fetchDashboard(true, true); 
                    fetchHistory();              
                } else {
                    alert("Gagal menghapus: " + data.message);
                }
            } catch(e) {
                alert("Terjadi kesalahan koneksi server.");
            }
            showLoading(false);
        }

        function toggleModalHarga() {
            const modal = document.getElementById('modal-harga');
            if (modal.classList.contains('opacity-0')) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                setTimeout(() => modal.classList.add('show'), 10);
            } else {
                modal.classList.remove('show');
                setTimeout(() => modal.classList.add('opacity-0', 'pointer-events-none'), 300);
            }
        }

        function bukaModalHarga(idTrx) {
            document.getElementById('mh-id').value = idTrx;
            document.getElementById('mh-harga').value = "";
            document.getElementById('mh-dp-nom').value = "";
            document.getElementById('mh-dp-pct').value = "30";
            document.getElementById('mh-tipe').value = "Lunas";
            toggleMHDpUI();
            toggleModalHarga();
        }

        function toggleMHDpUI() {
            const val = document.getElementById('mh-tipe').value;
            const area = document.getElementById('mh-area-dp');
            if (val === 'DP') area.classList.remove('hidden');
            else area.classList.add('hidden');
        }

        function hitungDPCustom(sumber) {
            let total = parseInt(document.getElementById('mh-harga').value) || 0;
            let inpPct = document.getElementById('mh-dp-pct');
            let inpNom = document.getElementById('mh-dp-nom');

            if (sumber === 'pct') {
                let p = parseFloat(inpPct.value) || 0;
                if (p > 100) { p = 100; inpPct.value = 100; }
                inpNom.value = Math.round(total * (p / 100));
            } else if (sumber === 'nom') {
                let n = parseFloat(inpNom.value) || 0;
                if (n > total) { n = total; inpNom.value = total; }
                inpPct.value = ((n / total) * 100).toFixed(1);
            }
        }

        async function simpanHargaCustom() {
            showLoading(true);
            toggleModalHarga();

            let tipeBayar = document.getElementById('mh-tipe').value;
            let detailDpVal = "-";
            if (tipeBayar === 'DP') {
                detailDpVal = `${document.getElementById('mh-dp-pct').value}% (Rp ${document.getElementById('mh-dp-nom').value})`;
            }

            const payload = {
                action: "updateCustomHarga",
                id_transaksi: document.getElementById('mh-id').value,
                total_harga: document.getElementById('mh-harga').value,
                metode_bayar: document.getElementById('mh-metode').value,
                tipe_pembayaran: tipeBayar,
                detail_dp: detailDpVal
            };

            try {
               const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain' } });
                const data = await res.json();
                if (data.status === 'success') {
                    fetchPenjualan(true, false);
                }
            } catch (e) {
                alert('Gagal menyimpan quotation.');
            }
            showLoading(false);
        }

        function toggleModalBukti() {
            const modal = document.getElementById('modal-bukti');
            if (modal.classList.contains('opacity-0')) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                setTimeout(() => modal.classList.add('show'), 10);
            } else {
                modal.classList.remove('show');
                setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); }, 300);
            }
        }

        function bukaBuktiModal(url) {
            document.getElementById('img-bukti-detail').src = url;
            toggleModalBukti();
        }

        
        function renderGridTranskrip() {
            const grid = document.getElementById('grid-transkrip');
            const produkTerjual = {};

            globalPenjualan.forEach(p => {
                const id = p['ID Paket'] || p['ID Baju'];
                let statAcara = p['Status Acara'] || p.Status;
                if (!produkTerjual[id]) {
                    produkTerjual[id] = { id: id, nama: p['Nama Paket'] || p['Nama Baju'], qty: 0, total: 0 };
                }
                if (statAcara !== 'Dibatalkan') {
                    produkTerjual[id].qty += parseInt(p['Jumlah Pax/Item'] || p.Jumlah || 0);
                    produkTerjual[id].total += parseInt(p['Total Harga'] || 0);
                }
            });

            const arrProduk = Object.values(produkTerjual).sort((a, b) => b.qty - a.qty);

            if (arrProduk.length > 0) {
                grid.innerHTML = arrProduk.map(p => `
                    <div onclick="bukaTranskripDetail('${p.id}')" class="bg-black p-4 md:p-5 rounded-2xl md:rounded-[24px] cursor-pointer hover:border-gold-500 border border-zinc-800 transition-colors shadow-sm">
                        <div><h4 class="font-bold text-white text-xs md:text-sm truncate group-hover:text-gold-400">${p.nama}</h4><p class="text-[9px] md:text-[10px] font-mono text-zinc-500 mb-3 md:mb-4">${p.id}</p></div>
                        <div class="flex justify-between items-end">
                            <div><p class="text-[8px] md:text-[9px] uppercase font-bold text-zinc-500">Total Klien/Pax</p><p class="font-bold text-blue-400 text-base md:text-lg">${p.qty} <span class="text-[10px] text-blue-500 font-normal">Pax</span></p></div>
                            <div class="text-right"><p class="text-[8px] md:text-[9px] uppercase font-bold text-zinc-500">Estimasi Valuasi</p><p class="font-extrabold text-gold-500 text-sm md:text-base">${formatRp(p.total)}</p></div>
                        </div>
                    </div>
                `).join('');
            } else {
                grid.innerHTML = `<div class="col-span-full text-center py-10 md:py-12 text-zinc-600 text-xs md:text-sm">Belum ada rekaman acara yg sukses.</div>`;
            }
        }

        function bukaTranskripDetail(id) {
            activeTranskripId = id;
            activeTranskripBulan = 'Semua Waktu';
            const p = globalPenjualan.find(x => (x['ID Paket'] || x['ID Baju']) === id);
            document.getElementById('transkrip-nama-produk').textContent = p ? (p['Nama Paket'] || p['Nama Baju']) : id;
            renderTranskripFilterBulan();
            renderTranskripTable();
            toggleModalTranskrip();
        }

        function renderTranskripFilterBulan() {
            const container = document.getElementById('transkrip-filter-bulan');
            const dataProduk = globalPenjualan.filter(p => (p['ID Paket'] || p['ID Baju']) === activeTranskripId);
            let listBulan = [...new Set(dataProduk.map(p => getBulanTahun(p.Tanggal)))];
            let html = `<button onclick="setTranskripBulan('Semua Waktu')" class="shrink-0 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all border ${activeTranskripBulan === 'Semua Waktu' ? 'bg-gold-500 text-black border-gold-500' : 'bg-black text-zinc-400 border-zinc-800 hover:bg-zinc-800'}">Semua</button>`;

            listBulan.forEach(bln => {
                const activeClass = (activeTranskripBulan === bln) ? 'bg-gold-500 text-black border-gold-500' : 'bg-black text-zinc-400 border-zinc-800 hover:bg-zinc-800';
                html += `<button onclick="setTranskripBulan('${bln}')" class="shrink-0 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all border ${activeClass}">${bln}</button>`;
            });
            container.innerHTML = html;
        }

        function setTranskripBulan(bulan) {
            activeTranskripBulan = bulan;
            renderTranskripFilterBulan();
            renderTranskripTable();
        }

        function renderTranskripTable() {
            const tbody = document.getElementById('transkrip-table-body');
            let dataTampil = globalPenjualan.filter(p => (p['ID Paket'] || p['ID Baju']) === activeTranskripId && (p['Status Acara'] || p.Status) !== 'Dibatalkan');
            if (activeTranskripBulan !== 'Semua Waktu') {
                dataTampil = dataTampil.filter(p => getBulanTahun(p.Tanggal) === activeTranskripBulan);
            }

            let varianSummary = {};
            dataTampil.forEach(p => {
                try {
                    let vars = JSON.parse(p['Detail Pilihan'] || p['Varian Detail']);
                    if (Array.isArray(vars)) {
                        vars.forEach(v => {
                            let key = `${v.opsi1 || v.ukuran} - ${v.opsi2 || v.lengan}`;
                            if (!varianSummary[key]) varianSummary[key] = 0;
                            varianSummary[key] += parseInt(v.jumlah);
                        });
                    } else if (vars.opsi1 || vars.ukuran) {
                        let key = `${vars.opsi1 || vars.ukuran} - ${vars.opsi2 || vars.lengan}`;
                        if (!varianSummary[key]) varianSummary[key] = 0;
                        varianSummary[key] += parseInt(p['Jumlah Pax/Item'] || p.Jumlah);
                    }
                } catch (e) { }
            });

            const summaryContainer = document.getElementById('transkrip-summary-varian');
            let summaryHtml = '';
            for (const [key, qty] of Object.entries(varianSummary)) {
                if (!key.includes("Default")) {
                    summaryHtml += `<div class="bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-center"><p class="text-[9px] md:text-[10px] text-zinc-400 font-bold uppercase">${key}</p><p class="text-gold-400 font-bold text-sm md:text-base mt-0.5">${qty} Pax</p></div>`;
                }
            }

            if (summaryHtml === '') {
                summaryHtml = `<div class="col-span-full text-xs text-zinc-600 font-medium px-1">Tidak ada detail paket spesifik.</div>`;
            }
            summaryContainer.innerHTML = summaryHtml;

            if (dataTampil.length > 0) {
                tbody.innerHTML = dataTampil.map(p => {
                    let statAcara = p['Status Acara'] || p.Status;
                    let statusColor = statAcara === 'Diproses' ? 'text-blue-400' : (statAcara === 'Selesai' ? 'text-emerald-400' : (statAcara === 'Dibatalkan' ? 'text-red-400' : 'text-orange-400'));
                    return `
                    <tr class="border-b border-zinc-800/50">
                        <td class="px-3 md:px-4 py-2.5 md:py-3"><span class="font-mono font-bold text-[9px] md:text-[10px] text-gold-500 block truncate max-w-[80px] md:max-w-none">${p['ID Booking'] || p['ID Transaksi']}</span><span class="text-[8px] md:text-[9px] text-zinc-500 block">${p.Tanggal.split(' ')[0]}</span></td>
                        <td class="px-3 md:px-4 py-2.5 md:py-3 text-[10px] md:text-[11px] font-bold text-white truncate max-w-[100px] md:max-w-none">@${p['Username Klien'] || p['Username Pembeli']}</td>
                        <td class="px-3 md:px-4 py-2.5 md:py-3"><p class="text-zinc-300 text-[10px] md:text-[11px] font-bold">${formatRp(p['Total Harga'])}</p><p class="text-[8px] md:text-[9px] text-zinc-500">${p['Jumlah Pax/Item'] || p.Jumlah} Pax</p></td>
                        <td class="px-3 md:px-4 py-2.5 md:py-3 text-center"><span class="text-[8px] md:text-[9px] font-bold uppercase ${statusColor}">${statAcara || 'Menunggu'}</span></td>
                    </tr>`
                }).join('');
            } else {
                tbody.innerHTML = `<tr><td colspan="4" class="py-8 md:py-10 text-center text-zinc-600 text-xs md:text-sm">Tidak ada data.</td></tr>`;
            }
        }

        function toggleModalTranskrip() {
            const modal = document.getElementById('modal-transkrip');
            if (modal.classList.contains('opacity-0')) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                setTimeout(() => modal.classList.add('show'), 10);
            } else {
                modal.classList.remove('show');
                setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); }, 300);
            }
        }

        
        async function fetchPelanggan(force = false, silent = false) {
            if (!force && dataLoaded.pelanggan && globalPelanggan.length > 0) {
                renderGridPelanggan();
                return;
            }
            if (!silent) showLoading(true);
            try {
                const res = await fetch(`${SCRIPT_URL}?action=getPelanggan&t=${new Date().getTime()}`);
                const data = await res.json();
                if (data.status === 'success') {
                    globalPelanggan = data.data;
                    dataLoaded.pelanggan = true;
                    renderGridPelanggan();
                }
            } catch (e) { }
            if (!silent) showLoading(false);
        }

        function renderGridPelanggan() {
            const grid = document.getElementById('grid-pelanggan');
            let dataTampil = globalPelanggan;

           
            const searchInput = document.getElementById('search-pelanggan');
            if (searchInput) {
                const query = searchInput.value.toLowerCase().trim();
                if (query !== "") {
                    dataTampil = dataTampil.filter(p => {
                        const namaStr = String(p['Nama Lengkap'] || "").toLowerCase();
                        const userStr = String(p.Username || "").toLowerCase();
                        return namaStr.includes(query) || userStr.includes(query);
                    });
                }
            }

            if (dataTampil.length > 0) {
                grid.innerHTML = dataTampil.map(p => `
                    <div onclick="bukaDetailPelanggan('${p.Username}')" class="bg-black p-3 md:p-4 rounded-2xl md:rounded-[24px] flex items-center gap-3 md:gap-4 cursor-pointer hover:border-gold-500 border border-zinc-800 transition-colors">
                        <img src="${p['URL Foto Profil'] || 'https://ui-avatars.com/api/?name=Client&background=D4AF37&color=000'}" class="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border border-zinc-700 shrink-0">
                        <div class="overflow-hidden"><h4 class="font-bold text-white text-xs md:text-sm truncate">${p['Nama Lengkap']}</h4><p class="text-[9px] md:text-[10px] text-gold-600 truncate">@${p.Username}</p></div>
                    </div>
                `).join('');
            } else {
                grid.innerHTML = `<div class="col-span-full py-10 md:py-12 text-center text-zinc-600 text-xs md:text-sm">Klien tidak ditemukan.</div>`;
            }
        }

        function toggleModalPelanggan() {
            const modal = document.getElementById('modal-pelanggan');
            if (modal.classList.contains('opacity-0')) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                setTimeout(() => modal.classList.add('show'), 10);
            } else {
                modal.classList.remove('show');
                setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); }, 300);
            }
        }

        function bukaDetailPelanggan(username) {
            const prof = globalPelanggan.find(p => p.Username === username);
            if (!prof) return;

            document.getElementById('dtl-nama').textContent = prof['Nama Lengkap'];
            document.getElementById('dtl-user').textContent = "@" + prof.Username;
            document.getElementById('dtl-foto').src = prof['URL Foto Profil'] || 'https://ui-avatars.com/api/?name=Client&background=D4AF37&color=000';

            const pesananUser = globalPenjualan.filter(p => (p['Username Klien'] || p['Username Pembeli']) === username).reverse();
            const listPesanan = document.getElementById('list-pesanan-pelanggan');

            if (pesananUser.length > 0) {
                listPesanan.innerHTML = pesananUser.map(p => {
                    let statAcara = p['Status Acara'] || p.Status;
                    let statusColor = statAcara === 'Diproses' ? 'text-blue-400' : (statAcara === 'Selesai' ? 'text-emerald-400' : (statAcara === 'Dibatalkan' ? 'text-red-400' : 'text-orange-400'));
                    return `
                    <div onclick="bukaDetailPesananModal('${p['ID Booking'] || p['ID Transaksi']}')" class="bg-black p-3 rounded-xl shadow-sm border border-zinc-800 flex justify-between items-center cursor-pointer hover:border-gold-500 transition-colors gap-2">
                        <div class="overflow-hidden">
                            <p class="font-bold text-white text-[10px] md:text-[11px] truncate">${p['Nama Paket'] || p['Nama Baju']}</p>
                            <p class="text-[8px] md:text-[9px] text-zinc-500 mt-0.5 truncate">${p['ID Booking'] || p['ID Transaksi']} &bull; ${p.Tanggal.split(' ')[0]}</p>
                        </div>
                        <div class="text-right shrink-0">
                            <span class="block text-[8px] md:text-[9px] font-bold uppercase ${statusColor}">${statAcara || 'Menunggu'}</span>
                        </div>
                    </div>`;
                }).join('');
            } else {
                listPesanan.innerHTML = `<div class="text-center text-zinc-600 text-[10px] md:text-xs py-4">Belum ada riwayat booking.</div>`;
            }
            toggleModalPelanggan();
        }

       
        function toggleModalDetailPesanan() {
            const modal = document.getElementById('modal-detail-pesanan');
            if (modal.classList.contains('opacity-0')) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                setTimeout(() => modal.classList.add('show'), 10);
            } else {
                modal.classList.remove('show');
                setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); }, 300);
            }
        }

        function bukaDetailPesananModal(idTrx) {
            const trx = globalPenjualan.find(p => (p['ID Booking'] || p['ID Transaksi']) === idTrx); if (!trx) return;
            const content = document.getElementById('content-detail-pesanan'); currentTrxPrint = trx;

            const berkas = globalBerkas.find(b => b['ID Booking'] === idTrx); let berkasHtml = ''; let upgradeRincianHtml = '';
            if (berkas) {
                let fileLampiran = berkas['File Buku Panduan'] ? `<a href="${berkas['File Buku Panduan']}" target="_blank" class="bg-blue-900/30 text-blue-400 border border-blue-500/20 font-bold px-3 py-1.5 rounded-lg text-[10px] md:text-[11px] inline-block mt-2 hover:bg-blue-600 hover:text-white transition-colors"><i class="fa-solid fa-file-word"></i> Lihat Form Terisi</a>` : '<p class="text-[9px] text-zinc-500 italic mt-1">Belum upload file form</p>';
                berkasHtml = `
                <div class="bg-black border border-gold-500/30 p-3 md:p-4 rounded-xl mb-3 md:mb-4 shadow-sm relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-20 h-20 bg-gold-600/10 blur-xl rounded-full pointer-events-none"></div>
                    <h5 class="font-bold text-gold-500 text-xs md:text-sm mb-2 border-b border-zinc-800 pb-2"><i class="fa-solid fa-folder-open mr-1"></i> Data Pemberkasan Klien</h5>
                    <div class="grid grid-cols-2 gap-2 text-[10px] md:text-[11px] mb-2">
                        <div><span class="text-zinc-500 block">CPP:</span><span class="font-bold text-white">${berkas['Nama CPP'] || '-'}</span></div>
                        <div><span class="text-zinc-500 block">CPW:</span><span class="font-bold text-white">${berkas['Nama CPW'] || '-'}</span></div>
                        <div><span class="text-zinc-500 block">Tgl Akad:</span><span class="font-bold text-zinc-300">${berkas['Tgl Akad'] ? String(berkas['Tgl Akad']).split('T')[0] : '-'} (${berkas['Waktu Akad'] || '-'})</span></div>
                        <div><span class="text-zinc-500 block">Tgl Resepsi:</span><span class="font-bold text-zinc-300">${berkas['Tgl Resepsi'] ? String(berkas['Tgl Resepsi']).split('T')[0] : '-'} (${berkas['Waktu Resepsi'] || '-'})</span></div>
                        <div class="col-span-2"><span class="text-zinc-500 block">Konsep & Tema:</span><span class="font-medium text-zinc-300">${berkas['Konsep Pernikahan'] || '-'}</span></div>
                    </div>
                    ${fileLampiran}
                </div>`;

                if (berkas['Data Upgrade'] && berkas['Data Upgrade'] !== '[]' && berkas['Data Upgrade'] !== '') {
                    try {
                        let upgArr = JSON.parse(berkas['Data Upgrade']);
                        if (upgArr.length > 0) {
                            upgradeRincianHtml = `<div class="mt-3 pt-3 border-t border-zinc-800"><p class="text-[10px] font-bold text-blue-400 mb-1"><i class="fa-solid fa-arrow-up-right-dots"></i> Rincian Upgrade Tambahan:</p><ul class="list-disc list-inside text-xs text-zinc-300 space-y-1">`;
                            upgArr.forEach(u => { let sub = parseInt(u.jumlah) * parseInt(u.harga); upgradeRincianHtml += `<li><span class="font-medium">${u.nama}</span> (x${u.jumlah}) - <span class="text-gold-400 font-semibold">${formatRp(sub)}</span></li>`; });
                            upgradeRincianHtml += `</ul></div>`;
                        }
                    } catch (e) { }
                }
            }

            let bukti1HTML = `<div class="text-center text-[9px] md:text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 py-1.5 md:py-2 rounded-lg mb-2">Cash di Kantor</div>`;
            if (trx['Bukti Pembayaran'] && trx['Bukti Pembayaran'] !== "Bayar Cash" && trx['Bukti Pembayaran'] !== "Bayar Cash di Kantor" && trx['Bukti Pembayaran'] !== "-") bukti1HTML = `<button type="button" onclick="bukaBuktiModal('${trx['Bukti Pembayaran']}')" class="w-full bg-gold-500/10 text-gold-500 border border-gold-500/20 font-bold py-2 md:py-2.5 rounded-lg text-[10px] md:text-[11px] mb-2 hover:bg-gold-500 hover:text-black transition-colors"><i class="fa-solid fa-image"></i> Struk Utama/DP</button>`;

            let bukti2HTML = "";
            if (trx['Tipe Pembayaran'] === 'DP') {
                if (trx['Bukti Pelunasan'] && trx['Bukti Pelunasan'].startsWith("http")) bukti2HTML = `<button type="button" onclick="bukaBuktiModal('${trx['Bukti Pelunasan']}')" class="w-full bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 font-bold py-2 md:py-2.5 rounded-lg text-[10px] md:text-[11px] hover:bg-emerald-600 hover:text-white transition-colors"><i class="fa-solid fa-image"></i> Struk Pelunasan</button>`;
                else bukti2HTML = `<div class="text-center text-[9px] md:text-[10px] text-orange-400 bg-orange-900/30 border border-orange-500/20 py-1.5 md:py-2 rounded-lg font-bold">Belum ada struk pelunasan</div>`;
            }

            let statAcara = trx['Status Acara'] || trx.Status; let statusColor = statAcara === 'Diproses' || statAcara === 'Diskusi Lanjutan' ? 'bg-blue-900/30 text-blue-400 border-blue-500/20' : (statAcara === 'Selesai' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/20' : (statAcara === 'Dibatalkan' ? 'bg-red-900/30 text-red-400 border-red-500/20' : 'bg-orange-900/30 text-orange-400 border-orange-500/20'));

            let varDetailHtml = "-";
            try { const varObj = JSON.parse(trx['Detail Pilihan'] || trx['Varian Detail']); if (Array.isArray(varObj)) { varDetailHtml = `<ul class="list-disc list-inside text-xs text-zinc-400 ml-4 mt-1">` + varObj.map(v => `<li>${v.opsi1 || v.ukuran} - ${v.opsi2 || v.lengan} (x${v.jumlah})</li>`).join('') + `</ul>`; } else if (varObj.opsi1 || varObj.ukuran) { varDetailHtml = `<span class="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px] font-bold inline-block mt-1 border border-zinc-700">${varObj.opsi1 || varObj.ukuran} - ${varObj.opsi2 || varObj.lengan}</span>`; } } catch (e) { }

            const isDP = trx['Tipe Pembayaran'] === 'DP'; let totalHarga = parseInt(trx['Total Harga']) || 0; let dpNominal = 0; if (isDP && trx['Detail DP']) { const match = String(trx['Detail DP']).match(/Rp\s*(\d+)/); if (match) dpNominal = parseInt(match[1]); }
            let statBayarStr = trx['Status Pembayaran'] || ''; let sudahLunas = statBayarStr.toLowerCase().includes('lunas'); let sudahDP = statBayarStr.toLowerCase().includes('sudah dp') || sudahLunas;

            let sisaTagihan = totalHarga; if (isDP) { if (sudahLunas) sisaTagihan = 0; else if (sudahDP) sisaTagihan = totalHarga - dpNominal; } else { if (sudahLunas) sisaTagihan = 0; }

            let tipePembayaranAwal = trx['Tipe Pembayaran']; let metodeBayarAwal = trx['Metode Bayar'] || '-'; let metodeDisplay1 = metodeBayarAwal; let metodeDisplay2 = '';
            if (statBayarStr.includes('Belum DP (Cash)') || statBayarStr.includes('Sudah DP (Cash)')) metodeDisplay1 = 'Cash'; else if (statBayarStr.includes('Sudah DP (QRIS)')) metodeDisplay1 = 'QRIS'; else if (statBayarStr.includes('Lunas (QRIS)')) { if (isDP) metodeDisplay2 = 'QRIS'; else metodeDisplay1 = 'QRIS'; } else if (statBayarStr.includes('Lunas (Cash)')) { if (isDP) metodeDisplay2 = 'Cash'; else metodeDisplay1 = 'Cash'; }

            let infoMetodeHtml = `<div class="flex justify-between mb-1.5"><span class="text-[9px] md:text-[10px] text-zinc-500">Tipe / Metode Awal</span><span class="text-[9px] md:text-[10px] font-bold text-white">${tipePembayaranAwal} - ${metodeDisplay1}</span></div>`;
            if (metodeDisplay2) infoMetodeHtml += `<div class="flex justify-between mb-1.5"><span class="text-[9px] md:text-[10px] text-zinc-500">Metode Pelunasan</span><span class="text-[9px] md:text-[10px] font-bold text-emerald-400">Pelunasan (${metodeDisplay2})</span></div>`;

            content.innerHTML = `
                <div class="flex justify-between items-center mb-3"><span class="font-mono text-[9px] md:text-[10px] font-bold text-gold-500">${trx['ID Booking'] || trx['ID Transaksi']}</span><span class="px-2 py-1 rounded text-[9px] md:text-[10px] font-bold uppercase border ${statusColor}">${statAcara || 'Menunggu'}</span></div>
                <div class="mb-3 md:mb-4"><p class="font-bold text-white text-sm md:text-base">${trx['Nama Paket'] || trx['Nama Baju']}</p><p class="text-[9px] md:text-[10px] font-bold text-zinc-500 mt-0.5">${trx['Jumlah Pax/Item'] || trx.Jumlah} Item/Pax</p><div class="mt-2 text-sm text-zinc-400"><span class="font-bold text-gold-600 text-[10px]">Rincian Layanan:</span> ${varDetailHtml}</div>${upgradeRincianHtml}</div>
                ${berkasHtml}
                <div class="bg-black border border-zinc-800 p-3 md:p-4 rounded-xl mb-3 md:mb-4 shadow-sm">
                    ${infoMetodeHtml}
                    <div class="flex justify-between mb-1.5"><span class="text-[9px] md:text-[10px] text-zinc-500">Status Bayar</span><span class="text-[9px] md:text-[10px] font-bold ${sudahLunas ? 'text-emerald-400' : 'text-orange-400'}">${statBayarStr}</span></div>
                    <div class="h-px bg-zinc-800 w-full my-2"></div>
                    <div class="flex justify-between mb-1.5"><span class="text-[9px] md:text-[10px] text-zinc-500">Total Biaya (Estimasi)</span><span class="text-[9px] md:text-[10px] font-bold text-white">${formatRp(totalHarga)}</span></div>
                    ${(isDP && sudahDP) ? `<div class="flex justify-between mb-1.5 text-emerald-400"><span class="text-[9px] md:text-[10px] font-medium">Deposit (${trx['Detail DP']})</span><span class="text-[9px] md:text-[10px] font-bold">- ${formatRp(dpNominal)}</span></div>` : ''}
                    ${(isDP && sudahLunas) ? `<div class="flex justify-between mb-1.5 text-emerald-400"><span class="text-[9px] md:text-[10px] font-medium">Pelunasan Akhir</span><span class="text-[9px] md:text-[10px] font-bold">- ${formatRp(totalHarga - dpNominal)}</span></div>` : ''}
                    <div class="flex justify-between mt-2 pt-2 border-t border-zinc-800"><span class="text-[9px] md:text-[10px] text-zinc-500 font-bold">${sudahLunas ? 'Status Tagihan' : 'Sisa Tagihan'}</span><span class="text-xs md:text-sm font-black ${sudahLunas ? 'text-emerald-400' : 'text-red-400'}">${sudahLunas ? '<i class="fa-solid fa-check-double mr-1"></i> LUNAS' : formatRp(sisaTagihan)}</span></div>
                </div>
                ${bukti1HTML} ${bukti2HTML}
            `;
            const modal = document.getElementById('modal-detail-pesanan'); modal.classList.remove('opacity-0', 'pointer-events-none'); setTimeout(() => modal.classList.add('show'), 10); document.body.classList.add('modal-active');
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

     
        function openCropperSingle(event, previewId, targetVar, isLarge = false) {
            const file = event.target.files[0];
            if (!file) return;

            targetPreview = previewId;
            targetVarBase64 = targetVar;
            isLargeSize = isLarge;

            const reader = new FileReader();
            reader.onload = function (e) {
                const cropperImage = document.getElementById('cropper-image');
                cropperImage.removeAttribute('crossOrigin');

                const modal = document.getElementById('modal-cropper');
                modal.classList.remove('opacity-0', 'pointer-events-none');
                setTimeout(() => modal.classList.add('show'), 10);
                document.body.classList.add('modal-active');

                if (cropperInstance) {
                    cropperInstance.destroy();
                    cropperInstance = null;
                }

                cropperImage.onload = function () {
                    try {
                        cropperInstance = new Cropper(cropperImage, {
                            viewMode: 1,
                            dragMode: 'move',
                            autoCropArea: 0.9,
                            restore: false,
                            guides: true,
                            center: true,
                            highlight: false,
                            cropBoxMovable: true,
                            cropBoxResizable: true,
                            toggleDragModeOnDblclick: false
                        });
                    } catch (err) {
                        console.log(err);
                    }
                    cropperImage.onload = null;
                };
                cropperImage.src = e.target.result;
            }
            reader.readAsDataURL(file);
            event.target.value = "";
        }

        function openCropperFromUrl(event, previewId, targetVar, isLarge = false) {
            event.stopPropagation();
            const previewEl = document.getElementById(previewId);
            if (!previewEl || !previewEl.src) return;

            targetPreview = previewId;
            targetVarBase64 = targetVar;
            isLargeSize = isLarge;

            const cropperImage = document.getElementById('cropper-image');
            let finalUrl = previewEl.src;

            if (finalUrl.startsWith('http') && !finalUrl.includes('data:image')) {
                finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'cb=' + new Date().getTime();
                cropperImage.crossOrigin = "anonymous";
            } else {
                cropperImage.removeAttribute('crossOrigin');
            }

            const modal = document.getElementById('modal-cropper');
            modal.classList.remove('opacity-0', 'pointer-events-none');
            setTimeout(() => modal.classList.add('show'), 10);
            document.body.classList.add('modal-active');

            if (cropperInstance) {
                cropperInstance.destroy();
                cropperInstance = null;
            }

            cropperImage.onload = function () {
                try {
                    cropperInstance = new Cropper(cropperImage, {
                        viewMode: 1,
                        dragMode: 'move',
                        autoCropArea: 0.9,
                        restore: false,
                        guides: true,
                        center: true,
                        highlight: false,
                        cropBoxMovable: true,
                        cropBoxResizable: true,
                        toggleDragModeOnDblclick: false,
                        checkCrossOrigin: true
                    });
                } catch (err) {
                    console.log(err);
                }
                cropperImage.onload = null;
            };
            cropperImage.src = finalUrl;
        }

        function closeCropper() {
            const modal = document.getElementById('modal-cropper');
            modal.classList.remove('show');

            setTimeout(() => {
                modal.classList.add('opacity-0', 'pointer-events-none');
                document.body.classList.remove('modal-active');
                if (cropperInstance) {
                    cropperInstance.destroy();
                    cropperInstance = null;
                }
                document.getElementById('cropper-image').src = '';
            }, 300);
        }

        function applyCrop() {
            if (!cropperInstance) return;

            const MAX_SIZE = isLargeSize ? 1600 : 800;
            const canvas = cropperInstance.getCroppedCanvas({
                maxWidth: MAX_SIZE,
                maxHeight: MAX_SIZE,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });

            if (!canvas) {
                alert("Gagal memotong gambar.");
                return;
            }

            let imageFormat = 'image/jpeg';
            
            if (targetVarBase64.includes('Logo')) {
                imageFormat = 'image/png';
            }

            const b64 = canvas.toDataURL(imageFormat, 0.85);
            window[targetVarBase64] = b64;

            const previewEl = document.getElementById(targetPreview);
            if (previewEl) {
                previewEl.src = b64;
                previewEl.classList.remove('hidden');
            }

            const actionEl = document.getElementById('actions-' + targetPreview);
            if (actionEl) {
                actionEl.classList.remove('hidden');
                actionEl.classList.add('flex');
            }
            closeCropper();
        }

        function hapusGambarPreview(event, previewId, targetVar) {
            event.stopPropagation();
            window[targetVar] = "DELETE";

            const preview = document.getElementById(previewId);
            if (preview) {
                preview.src = "";
                preview.classList.add('hidden');
            }

            const actionEl = document.getElementById('actions-' + previewId);
            if (actionEl) {
                actionEl.classList.add('hidden');
                actionEl.classList.remove('flex');
            }
        }

       
        async function fetchPengaturanAdmin(force = false, silent = false) {
            if (!force && dataLoaded.pengaturan) return;
            if (!silent) showLoading(true);

            try {
                const res = await fetch(`${SCRIPT_URL}?action=getPengaturan&t=${new Date().getTime()}`);
                const data = await res.json();

                if (data.status === 'success' && data.data) {
                    dataLoaded.pengaturan = true;

                    const configMap = {
                        'logo_light': { prev: 'preview-logo-light', btn: 'actions-preview-logo-light', b64: 'base64LogoLight' },
                        'logo_dark': { prev: 'preview-logo-dark', btn: 'actions-preview-logo-dark', b64: 'base64LogoDark' },
                        'login_bg': { prev: 'preview-loginbg', btn: 'actions-preview-loginbg', b64: 'base64LoginBg' },
                        'banner_1': { prev: 'preview-ban1', btn: 'actions-preview-ban1', b64: 'base64Ban1' },
                        'banner_2': { prev: 'preview-ban2', btn: 'actions-preview-ban2', b64: 'base64Ban2' },
                        'banner_3': { prev: 'preview-ban3', btn: 'actions-preview-ban3', b64: 'base64Ban3' },
                        'qris_lunas': { prev: 'preview-qris-lunas', btn: 'actions-preview-qris-lunas', b64: 'base64QrisLunas' },
                        'qris_dp': { prev: 'preview-qris-dp', btn: 'actions-preview-qris-dp', b64: 'base64QrisDp' }
                    };

                    data.data.forEach(item => {
                        if (configMap[item.Key]) {
                            const map = configMap[item.Key];
                            const prevEl = document.getElementById(map.prev);
                            const actionEl = document.getElementById(map.btn);

                            if (item.Value && item.Value.trim() !== "") {
                                prevEl.src = item.Value;
                                prevEl.classList.remove('hidden');
                                window[map.b64] = item.Value;
                                if (actionEl) {
                                    actionEl.classList.remove('hidden');
                                    actionEl.classList.add('flex');
                                }
                            } else {
                                prevEl.src = "";
                                prevEl.classList.add('hidden');
                                window[map.b64] = "";
                                if (actionEl) {
                                    actionEl.classList.add('hidden');
                                    actionEl.classList.remove('flex');
                                }
                            }
                        }

                        if (item.Key === 'admin_wa') {
                            document.getElementById('set-admin-wa').value = item.Value || "";
                        }
                        if (item.Key === 'qris_name') {
                            document.getElementById('set-qris-name').value = item.Value || "";
                        }
                        if (item.Key === 'link_buku_panduan') {
                            document.getElementById('set-link-panduan').value = item.Value || "";
                        }
                        if (item.Value) {
                            appSettings[item.Key] = item.Value;
                        }
                    });
                   
                    const sidebarLogoImg = document.getElementById('sidebar-logo-img');
                    const sidebarLogoIcon = document.getElementById('sidebar-logo-icon');
                   
                    const logoUrl = appSettings.logo_dark || appSettings.logo_light;
                    
                    if (logoUrl && logoUrl.trim() !== "") {
                        sidebarLogoImg.src = logoUrl;
                        sidebarLogoImg.classList.remove('hidden');
                        sidebarLogoIcon.classList.add('hidden');
                    } else {
                        sidebarLogoImg.src = "";
                        sidebarLogoImg.classList.add('hidden');
                        sidebarLogoIcon.classList.remove('hidden');
                    } 
                }
            } catch (e) { }

            if (!silent) showLoading(false);
        }

      async function handleSavePengaturan(e) {
            e.preventDefault();

            const btn = document.getElementById('btn-save-pengaturan');
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';
            btn.disabled = true;

            const payload = {
                action: "savePengaturan",
                logo_light: base64LogoLight,
                logo_dark: base64LogoDark,
                login_bg: base64LoginBg,
                banner_1: base64Ban1,
                banner_2: base64Ban2,
                banner_3: base64Ban3,
                qris_lunas: base64QrisLunas,
                qris_dp: base64QrisDp,
                admin_wa: document.getElementById('set-admin-wa').value,
                qris_name: document.getElementById('set-qris-name').value,
                link_buku_panduan: document.getElementById('set-link-panduan').value
            };

            try {
               
                const res = await fetch(SCRIPT_URL, { 
                    method: 'POST', 
                    body: JSON.stringify(payload), 
                    headers: { 'Content-Type': 'text/plain' } 
                });
                const data = await res.json();

                if (data.status === 'success') {
                    alert('Pengaturan WO berhasil diperbarui!');
                    fetchPengaturanAdmin(true, true); 
                } else {
                    alert('Gagal: ' + data.message);
                }
            } catch (err) {
                alert('Terjadi kesalahan koneksi.');
            }

            btn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-2"></i> Simpan Pengaturan';
            btn.disabled = false;
        }
       
        let berkasAdminBase64 = "";
        let berkasAdminLama = "";

        function toggleModalEditBerkas() {
            const modal = document.getElementById('modal-edit-berkas');
            if (modal.classList.contains('opacity-0')) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                setTimeout(() => modal.classList.add('show'), 10);
            } else {
                modal.classList.remove('show');
                setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); }, 300);
            }
        }

        function bukaEditBerkasAdmin(idTrx) {
            if (event) event.stopPropagation();
            const trx = globalPenjualan.find(p => (p['ID Booking'] || p['ID Transaksi']) === idTrx); if (!trx) return;
            const berkas = globalBerkas.find(b => b['ID Booking'] === idTrx);

            document.getElementById('ab-id-booking').value = idTrx;
            document.getElementById('ab-id-title').textContent = "ID Booking: " + idTrx;
            document.getElementById('ab-username').value = trx['Username Klien'] || trx['Username Pembeli'] || "Klien";

            document.getElementById('ab-pesanan').value = berkas ? berkas['Pesanan Paket'] : (trx['Nama Paket'] || trx['Nama Baju']);
            document.getElementById('ab-cpp').value = berkas ? berkas['Nama CPP'] : ''; document.getElementById('ab-cpw').value = berkas ? berkas['Nama CPW'] : '';
            let tglAkad = berkas ? berkas['Tgl Akad'] : ''; if (tglAkad && tglAkad.includes('T')) tglAkad = tglAkad.split('T')[0]; document.getElementById('ab-tgl-akad').value = tglAkad;
            document.getElementById('ab-wkt-akad').value = berkas ? berkas['Waktu Akad'] : '';
            let tglResepsi = berkas ? berkas['Tgl Resepsi'] : ''; if (tglResepsi && tglResepsi.includes('T')) tglResepsi = tglResepsi.split('T')[0]; document.getElementById('ab-tgl-resepsi').value = tglResepsi;
            let wktResepsi = berkas ? (berkas['Waktu Resepsi'] || '') : '';
            let arrWktResepsi = wktResepsi.split(/\s*-\s*/); 
            document.getElementById('ab-wkt-resepsi-mulai').value = arrWktResepsi[0] || '';
            document.getElementById('ab-wkt-resepsi-selesai').value = arrWktResepsi[1] || '';
            document.getElementById('ab-undangan').value = berkas ? berkas['Jumlah Undangan'] : ''; document.getElementById('ab-konsep').value = berkas ? berkas['Konsep Pernikahan'] : ''; document.getElementById('ab-makeup').value = berkas ? berkas['Konsep Make Up'] : ''; document.getElementById('ab-busana').value = berkas ? berkas['Busana Pengantin'] : ''; document.getElementById('ab-prewed').value = berkas ? berkas['Tgl & Lokasi Prewedding'] : '';
            
            const jdwlBerkas = globalJadwal[idTrx] || {};
            let infoTmBerkas = berkas ? berkas['Tgl & Lokasi TM'] : '';
            if (jdwlBerkas.tglTm || jdwlBerkas.waktuTm || jdwlBerkas.lokasiTm) {
                infoTmBerkas = `Tanggal: ${formatDateIndo(jdwlBerkas.tglTm || '-')}\nWaktu: ${jdwlBerkas.waktuTm || '-'}\nLokasi: ${jdwlBerkas.lokasiTm || '-'}`;
            }
            document.getElementById('ab-tm').value = infoTmBerkas;

            let dataUpgrade = berkas ? berkas['Data Upgrade'] : '';
            const listUpg = document.getElementById('list-ab-upgrade-paket'); listUpg.innerHTML = '';
            if (dataUpgrade && dataUpgrade !== "[]" && dataUpgrade !== "") {
                document.getElementById('ab-is-upgrade').checked = true; document.getElementById('area-ab-upgrade-paket').classList.remove('hidden');
                let upgArr = JSON.parse(dataUpgrade);
                upgArr.forEach(u => addAbUpgradeRow(u.nama, u.jumlah, u.harga));
            } else {
                document.getElementById('ab-is-upgrade').checked = false; document.getElementById('area-ab-upgrade-paket').classList.add('hidden');
            }

            const linkDownload = document.getElementById('ab-link-download');
            berkasAdminBase64 = ""; berkasAdminLama = berkas ? (berkas['File Buku Panduan'] || "") : ""; document.getElementById('ab-file-name').classList.add('hidden');
            if (berkasAdminLama && berkasAdminLama.startsWith("http")) {
                linkDownload.href = berkasAdminLama; linkDownload.className = "flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold text-center transition shadow-md cursor-pointer"; linkDownload.innerHTML = '<i class="fa-solid fa-download mr-1"></i> Unduh File Klien'; linkDownload.removeAttribute("onclick");
            } else {
                linkDownload.href = "#"; linkDownload.className = "flex-1 sm:flex-none bg-zinc-800 text-zinc-500 px-4 py-2 rounded-xl text-xs font-bold text-center cursor-not-allowed border border-zinc-700"; linkDownload.innerHTML = '<i class="fa-solid fa-ban mr-1"></i> Belum Ada File'; linkDownload.setAttribute("onclick", "event.preventDefault(); alert('Klien belum mengunggah dokumen.');");
            }
            toggleModalEditBerkas();
        }

        function prosesFileBerkasAdmin(event) {
            const file = event.target.files[0];
            const nameEl = document.getElementById('ab-file-name');
            if (!file) {
                berkasAdminBase64 = "";
                nameEl.classList.add('hidden');
                return;
            }
            nameEl.textContent = "File siap diunggah: " + file.name;
            nameEl.classList.remove('hidden');
            const reader = new FileReader();
            reader.onload = e => {
                berkasAdminBase64 = e.target.result;
            }
            reader.readAsDataURL(file);
        }

        async function simpanBerkasAdmin() {
            const idBooking = document.getElementById('ab-id-booking').value;
            const btn = document.getElementById('btn-simpan-berkas-admin');
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...'; btn.disabled = true;

            let upgradeArr = [];
            if (document.getElementById('ab-is-upgrade').checked) {
                document.querySelectorAll('.upg-ab-row').forEach(row => {
                    const nm = row.querySelector('.upg-ab-nama').value;
                    const qt = row.querySelector('.upg-ab-qty').value;
                    const hrg = row.querySelector('.upg-ab-hrg').value;
                    if (nm) upgradeArr.push({ nama: nm, jumlah: qt, harga: hrg });
                });
            }

            let wktResMulai = document.getElementById('ab-wkt-resepsi-mulai').value;
            let wktResSelesai = document.getElementById('ab-wkt-resepsi-selesai').value;
            let wktResGabung = (wktResMulai && wktResSelesai) ? `${wktResMulai} - ${wktResSelesai}` : (wktResMulai || wktResSelesai || '');

            const payload = { action: "saveBerkas", id_booking: idBooking, username: document.getElementById('ab-username').value, cpp: document.getElementById('ab-cpp').value, cpw: document.getElementById('ab-cpw').value, tgl_akad: document.getElementById('ab-tgl-akad').value, waktu_akad: document.getElementById('ab-wkt-akad').value, tgl_resepsi: document.getElementById('ab-tgl-resepsi').value, waktu_resepsi: wktResGabung, undangan: document.getElementById('ab-undangan').value, konsep: document.getElementById('ab-konsep').value, makeup: document.getElementById('ab-makeup').value, busana: document.getElementById('ab-busana').value, pesanan: document.getElementById('ab-pesanan').value, prewed: document.getElementById('ab-prewed').value, tm: document.getElementById('ab-tm').value, v_dekorasi: document.getElementById('v-ab-dekorasi').value, v_mua: document.getElementById('v-ab-mua').value, v_keluarga: document.getElementById('v-ab-keluarga').value, v_mc: document.getElementById('v-ab-mc').value, v_ent: document.getElementById('v-ab-ent').value, v_catering: document.getElementById('v-ab-catering').value, v_dok: document.getElementById('v-ab-dok').value, v_sound: document.getElementById('v-ab-sound').value, v_attire: document.getElementById('v-ab-attire').value, v_venue: document.getElementById('v-ab-venue').value, catatan: document.getElementById('ab-catatan').value, file_panduan: berkasAdminBase64, file_panduan_lama: berkasAdminLama, data_upgrade: JSON.stringify(upgradeArr) };

            try {
               const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain' } });
                const data = await res.json();
                if (data.status === 'success') { alert("Data Berkas Klien & Tagihan berhasil diperbarui!"); fetchBerkas(true, true); fetchPenjualan(true, true); toggleModalEditBerkas(); } else { alert("Gagal: " + data.message); }
            } catch (e) { alert("Kesalahan jaringan saat menyimpan berkas."); } finally { btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan'; btn.disabled = false; }
        }

      
        let globalVendor = [];
        let isEditingVendor = false;
        let base64GambarVendorArray = [];

        async function fetchVendor(force = false) {
            if (!force && globalVendor.length > 0) return;
            showLoading(true);
            try {
                const res = await fetch(`${SCRIPT_URL}?action=getVendor`);
                const data = await res.json();
                if (data.status === 'success') {
                    globalVendor = data.data;
                    renderTableVendor();
                }
            } catch (e) { }
            showLoading(false);
        }

        function renderTableVendor() {
            const tbody = document.getElementById('table-vendor');
            if (globalVendor.length > 0) {
                tbody.innerHTML = globalVendor.map(v => {
                    const gbr = (v['URL Gambar'] || '').split(',')[0] || 'https://via.placeholder.com/100';
                    return `
                    <tr class="hover:bg-zinc-900 border-b border-zinc-800/50">
                        <td class="px-4 py-3 flex items-center gap-3">
                            <img src="${gbr}" class="w-10 h-10 rounded-lg object-cover border border-zinc-700">
                            <div><p class="font-bold text-white text-sm">${v['Nama Vendor']}</p><p class="text-[9px] text-zinc-500 font-mono">${v['ID Vendor']}</p></div>
                        </td>
                        <td class="px-4 py-3 text-xs text-gold-400 font-bold">${v.Kategori}</td>
                        <td class="px-4 py-3 text-center">
                            <button onclick="mulaiEditVendor('${v['ID Vendor']}')" class="w-7 h-7 rounded-full bg-blue-900/30 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white mr-1"><i class="fa-solid fa-pen text-[10px]"></i></button>
                            <button onclick="hapusVendor('${v['ID Vendor']}')" class="w-7 h-7 rounded-full bg-red-900/30 text-red-400 border border-red-500/20 hover:bg-red-600 hover:text-white"><i class="fa-solid fa-trash text-[10px]"></i></button>
                        </td>
                    </tr>`;
                }).join('');
            } else {
                tbody.innerHTML = `<tr><td colspan="3" class="text-center py-8 text-zinc-500 text-xs">Belum ada data vendor.</td></tr>`;
            }
        }

        function toggleFormVendor() {
            const container = document.getElementById('form-vendor-container');
            if (container.classList.contains('hidden')) { container.classList.remove('hidden'); container.scrollIntoView({ behavior: "smooth" }); }
            else { batalEditVendor(); container.classList.add('hidden'); }
        }

        function previewImageMultipleVendor(event) {
            const files = event.target.files; if (!files || files.length === 0) return;
            document.getElementById('upload-placeholder-vendor').classList.add('hidden');
            const container = document.getElementById('v-gambar-preview-container'); container.classList.remove('hidden');
            base64GambarVendorArray = []; container.innerHTML = '';
            Array.from(files).forEach((file) => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = new Image();
                    img.onload = function () {
                        const canvas = document.createElement('canvas'); const MAX = 800;
                        let w = img.width; let h = img.height;
                        if (w > h && w > MAX) { h *= MAX / w; w = MAX; } else if (h > MAX) { w *= MAX / h; h = MAX; }
                        canvas.width = w; canvas.height = h;
                        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                        const b64 = canvas.toDataURL('image/jpeg', 0.8);
                        base64GambarVendorArray.push(b64);
                        container.innerHTML += `<img src="${b64}" class="w-14 h-14 object-cover rounded-lg border border-gold-500/30">`;
                    }
                    img.src = e.target.result;
                }
                reader.readAsDataURL(file);
            });
        }

        function mulaiEditVendor(id) {
            const v = globalVendor.find(x => x['ID Vendor'] == id); if (!v) return;
            isEditingVendor = true;
            document.getElementById('title-form-vendor').innerHTML = `<i class="fa-solid fa-pen text-xs"></i> Edit Vendor: ${id}`;
            document.getElementById('btn-batal-edit-vendor').classList.remove('hidden');
            document.getElementById('form-vendor-container').classList.remove('hidden');

            document.getElementById('v-id').value = id;
            document.getElementById('v-nama').value = v['Nama Vendor'];
            document.getElementById('v-kategori').value = v.Kategori;
            document.getElementById('v-deskripsi').value = v.Deskripsi;

            let gbrRaw = v['URL Gambar'] || ''; base64GambarVendorArray = gbrRaw ? gbrRaw.split(',') : [];
            const container = document.getElementById('v-gambar-preview-container');
            if (base64GambarVendorArray.length > 0 && base64GambarVendorArray[0] !== "") {
                document.getElementById('upload-placeholder-vendor').classList.add('hidden'); container.classList.remove('hidden');
                container.innerHTML = base64GambarVendorArray.map(url => `<img src="${url}" class="w-14 h-14 object-cover rounded-lg border border-gold-500/30">`).join('');
            } else {
                container.classList.add('hidden'); container.innerHTML = ''; document.getElementById('upload-placeholder-vendor').classList.remove('hidden');
            }
            document.getElementById('form-vendor-container').scrollIntoView({ behavior: "smooth" });
        }

        function batalEditVendor() {
            isEditingVendor = false;
            document.getElementById('title-form-vendor').innerHTML = `<i class="fa-solid fa-plus text-xs"></i> Tambah Vendor`;
            document.getElementById('btn-batal-edit-vendor').classList.add('hidden');
            document.getElementById('form-vendor').reset();
            document.getElementById('v-id').value = "";
            base64GambarVendorArray = [];
            document.getElementById('v-gambar-preview-container').classList.add('hidden'); document.getElementById('v-gambar-preview-container').innerHTML = '';
            document.getElementById('upload-placeholder-vendor').classList.remove('hidden');
        }

        async function handleSaveVendor(e) {
            e.preventDefault();
            const btn = document.getElementById('btn-submit-vendor'); btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Proses...'; btn.disabled = true;

            let vId = document.getElementById('v-id').value;
            if (!isEditingVendor) vId = "VND-" + new Date().getTime(); 

            const payload = {
                action: isEditingVendor ? "editVendor" : "addVendor",
                id: vId, nama: document.getElementById('v-nama').value,
                kategori: document.getElementById('v-kategori').value,
                deskripsi: document.getElementById('v-deskripsi').value,
                gambar: base64GambarVendorArray.join('|')
            };

            try {
               const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain' }});
                const data = await res.json();
                if (data.status === 'success') { alert(data.message); batalEditVendor(); fetchVendor(true); document.getElementById('form-vendor-container').classList.add('hidden'); }
                else { alert('Gagal: ' + data.message); }
            } catch (err) { alert('Kesalahan jaringan!'); }
            btn.innerHTML = '<i class="fa-solid fa-save"></i> Simpan Vendor'; btn.disabled = false;
        }

        async function hapusVendor(id) {
            if (!confirm(`Hapus vendor ID: ${id}?`)) return; showLoading(true);
            try {
                const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "deleteVendor", id: id }), headers: { 'Content-Type': 'text/plain' } });
                const data = await res.json(); if (data.status === 'success') fetchVendor(true);
            } catch (e) { } showLoading(false);
        }

     
        function updateNavTitles(tab) {
            const titles = {
                'dashboard': 'Dashboard',
                'produk': 'Katalog Paket',
                'vendor': 'Manajemen Vendor',
                'penjualan': 'Data Booking',
                'jadwal': 'Jadwal & Penugasan Kru', 
                'transkrip': 'Laporan Acara',
                'pelanggan': 'Klien',
                'pengaturan': 'Konfigurasi'
            };
            const titleEl = document.getElementById('page-title');
            if (titleEl) titleEl.textContent = titles[tab] || 'Admin';
        }

        function switchTab(tab) {
            const sections = ['dashboard', 'produk', 'penjualan', 'transkrip', 'pelanggan', 'pengaturan', 'vendor', 'jadwal', 'hnp'];
            sections.forEach(n => {
                const el = document.getElementById(`sec-${n}`);
                if (el) el.classList.add('hidden');
                const navD = document.getElementById(`nav-${n}`);
                if (navD) navD.className = "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-zinc-400 hover:bg-zinc-800 hover:text-gold-400 font-semibold transition-all active:scale-95 whitespace-nowrap";
                const mobEl = document.getElementById(`nav-mob-${n}`);
                if (mobEl) mobEl.className = "flex flex-col items-center justify-center gap-1.5 p-2 text-zinc-500 hover:text-gold-400 min-w-[72px] shrink-0 active:scale-90 transition-transform";
            });

            const targetSec = document.getElementById(`sec-${tab}`);
            if (targetSec) targetSec.classList.remove('hidden');

            const navActiveD = document.getElementById(`nav-${tab}`);
            if (navActiveD) navActiveD.className = "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gold-500 text-black font-bold transition-all shadow-md shadow-gold-900/20 active:scale-95 whitespace-nowrap";

            const mobActive = document.getElementById(`nav-mob-${tab}`);
            if (mobActive) mobActive.className = "flex flex-col items-center justify-center gap-1.5 p-2 text-gold-500 min-w-[72px] shrink-0 active:scale-90 transition-transform drop-shadow-sm";

            updateNavTitles(tab);

            if (tab === 'dashboard') fetchDashboard();
            if (tab === 'produk') fetchProduk();
            if (tab === 'penjualan') fetchPenjualan();
            if (tab === 'transkrip') renderGridTranskrip();
            if (tab === 'pelanggan') fetchPelanggan();
            if (tab === 'pengaturan') fetchPengaturanAdmin();
            if (tab === 'vendor') fetchVendor();
            if (tab === 'jadwal') renderJadwalEvent(); 
        }

        
        let currentKalenderDate = new Date();

        function switchPenjualanView(view) {
            const btnList = document.getElementById('btn-view-list');
            const btnCal = document.getElementById('btn-view-cal');
            const viewList = document.getElementById('view-list');
            const viewCal = document.getElementById('view-kalender');
            const filterWrapper = document.getElementById('filter-bulan-wrapper');

            if (view === 'list') {
                btnList.className = "bg-gold-500 text-black px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5";
                btnCal.className = "text-zinc-400 hover:text-gold-400 hover:bg-zinc-900 px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-colors flex items-center gap-1.5";
                viewList.classList.remove('hidden');
                viewCal.classList.add('hidden');
                filterWrapper.classList.remove('hidden');
            } else {
                btnCal.className = "bg-gold-500 text-black px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5";
                btnList.className = "text-zinc-400 hover:text-gold-400 hover:bg-zinc-900 px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-colors flex items-center gap-1.5";
                viewList.classList.add('hidden');
                viewCal.classList.remove('hidden');
                filterWrapper.classList.add('hidden');
                renderKalender();
            }
        }

        function parseTanggalBooking(tglStr) {
            
            try {
                let parts = tglStr.split(',')[0].split('/');
                if (parts.length === 3) {
                    return new Date(parts[2], parts[1] - 1, parts[0]);
                }
            } catch (e) { }
            return null;
        }

        function ubahBulanKalender(offset) {
            currentKalenderDate.setMonth(currentKalenderDate.getMonth() + offset);
            document.getElementById('kalender-detail-container').classList.add('hidden');
            renderKalender();
        }

        
        function getBookingDate(tglStr) {
            if (!tglStr || tglStr === '-') return null;
            
          
            if (tglStr.includes('/')) {
                const parts = tglStr.split(',')[0].split(' ')[0].split('/'); 
                if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
            
            if (tglStr.includes('-')) {
                const parts = tglStr.split('T')[0].split(' ')[0].split('-');
                if (parts[0].length === 4) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
            return new Date(tglStr); 
        }

       function renderKalender() {
            const year = currentKalenderDate.getFullYear();
            const month = currentKalenderDate.getMonth();
            const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            document.getElementById('kalender-title').textContent = `${monthNames[month]} ${year}`;

            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const grid = document.getElementById('kalender-grid');
            grid.innerHTML = '';

            const mapBooking = {};
            globalPenjualan.forEach(p => {
                if (p['Status Acara'] === 'Dibatalkan' || p.Status === 'Dibatalkan') return;
                
              
                let d = getBookingDate(p.Tanggal);

                if (d && d.getFullYear() === year && d.getMonth() === month) {
                    let tglKey = d.getDate();
                    if (!mapBooking[tglKey]) mapBooking[tglKey] = [];
                    mapBooking[tglKey].push(p);
                }
            });

            for (let i = 0; i < firstDay; i++) grid.innerHTML += `<div class="p-2 md:p-4 rounded-xl bg-black/20 border border-transparent"></div>`;

            let today = new Date();
            for (let i = 1; i <= daysInMonth; i++) {
                let isToday = (i === today.getDate() && month === today.getMonth() && year === today.getFullYear());
                let bookings = mapBooking[i] || [];
                let hasBooking = bookings.length > 0;

                let extraClass = "bg-black border-zinc-800 text-zinc-300 hover:bg-zinc-800";
                let badge = ""; let countText = "";

                if (hasBooking) {
                    extraClass = "bg-gold-500/20 border-gold-500/50 text-gold-400 hover:bg-gold-500/30 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-transform hover:scale-105 active:scale-95 z-10";
                    countText = `<p class="text-[8px] md:text-[9px] font-medium text-gold-200 truncate mt-0.5 md:mt-1 hidden sm:block">${bookings.length} Pesanan</p>`;
                    badge = `<div class="absolute -top-1.5 -right-1.5 w-4 h-4 md:w-5 md:h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold shadow-md border border-black">${bookings.length}</div>`;
                } else if (isToday) {
                    extraClass = "bg-blue-900/20 border-blue-500/30 text-blue-400";
                }

                let paramDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                grid.innerHTML += `<div ${hasBooking ? `onclick="lihatAcaraKalender('${paramDate}')"` : ''} class="relative p-2 md:p-3 rounded-xl md:rounded-2xl border flex flex-col items-center justify-center min-h-[44px] md:min-h-[64px] transition-colors ${extraClass}"><span class="text-xs md:text-sm font-bold ${isToday && !hasBooking ? 'text-blue-400' : ''}">${i}</span>${countText}${badge}</div>`;
            }
        }

        function lihatAcaraKalender(dateStr) {
            const parts = dateStr.split('-');
            const y_target = parseInt(parts[0]);
            const m_target = parseInt(parts[1]) - 1;
            const d_target = parseInt(parts[2]);

            const targetDate = new Date(y_target, m_target, d_target);
            document.getElementById('kalender-tgl-terpilih').textContent = targetDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

            const listContainer = document.getElementById('kalender-list-acara');
            let html = '';

            let acaraHariIni = globalPenjualan.filter(p => {
                if (p['Status Acara'] === 'Dibatalkan' || p.Status === 'Dibatalkan') return false;

               
                let d = getBookingDate(p.Tanggal);
                if (!d) return false;

                return d.getDate() === d_target && d.getMonth() === m_target && d.getFullYear() === y_target;
            });

            acaraHariIni.forEach(p => {
                const idTrx = p['ID Booking'] || p['ID Transaksi'];
                const nmPkt = p['Nama Paket'] || p['Nama Baju'];
                const clientNm = p['Username Klien'] || p['Username Pembeli'];
                const statAcara = p['Status Acara'] || p.Status || "Menunggu";

                let statusColor = statAcara === 'Diproses' || statAcara === 'Diskusi Lanjutan' ? 'text-blue-400 border-blue-500/30 bg-blue-900/20' : (statAcara === 'Selesai' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-900/20' : 'text-orange-400 border-orange-500/30 bg-orange-900/20');

                html += `
                    <div onclick="bukaDetailPesananModal('${idTrx}')" class="bg-black p-3 md:p-4 rounded-xl md:rounded-[20px] border border-zinc-700 hover:border-gold-500 cursor-pointer transition flex justify-between items-center gap-3 group shadow-sm">
                        <div class="overflow-hidden flex-1">
                            <span class="text-[9px] md:text-[10px] font-mono font-bold text-gold-500 mb-0.5 md:mb-1 block">${idTrx}</span>
                            <h5 class="font-bold text-white text-xs md:text-sm truncate group-hover:text-gold-400 transition-colors">${nmPkt}</h5>
                            <p class="text-[10px] md:text-[11px] text-zinc-400 mt-1 truncate"><i class="fa-regular fa-user mr-1 text-zinc-500"></i> ${clientNm}</p>
                        </div>
                        <div class="text-right shrink-0 flex flex-col items-end justify-center">
                            <span class="px-2 py-1 rounded text-[8px] md:text-[9px] font-bold uppercase border ${statusColor} block mb-2 shadow-sm">${statAcara}</span>
                            <span class="text-[9px] md:text-[10px] text-zinc-500 font-bold group-hover:text-gold-500 transition-colors bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">Detail Pesanan <i class="fa-solid fa-arrow-right ml-1"></i></span>
                        </div>
                    </div>
                `;
            });

            listContainer.innerHTML = html;
            document.getElementById('kalender-detail-container').classList.remove('hidden');

            setTimeout(() => {
                document.getElementById('kalender-detail-container').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 50);
        }

        function cetakBerkasAdmin() {
            const idBooking = document.getElementById('ab-id-booking').value;
            if (!idBooking) return alert("Pilih pesanan terlebih dahulu!");

            let wktResMulai = document.getElementById('ab-wkt-resepsi-mulai').value;
            let wktResSelesai = document.getElementById('ab-wkt-resepsi-selesai').value;
            let wktResGabung = (wktResMulai && wktResSelesai) ? `${wktResMulai} - ${wktResSelesai}` : (wktResMulai || wktResSelesai || '-');

            const data = {
                id: idBooking, klien: document.getElementById('ab-username').value || '-', cpp: document.getElementById('ab-cpp').value || '-', cpw: document.getElementById('ab-cpw').value || '-', tglAkad: document.getElementById('ab-tgl-akad').value || '-', wktAkad: document.getElementById('ab-wkt-akad').value || '-', tglResepsi: document.getElementById('ab-tgl-resepsi').value || '-', wktResepsi: wktResGabung, undangan: document.getElementById('ab-undangan').value || '-', pesanan: document.getElementById('ab-pesanan').value || '-', konsep: document.getElementById('ab-konsep').value || '-', makeup: document.getElementById('ab-makeup').value || '-', busana: document.getElementById('ab-busana').value || '-', prewed: document.getElementById('ab-prewed').value || '-', tm: document.getElementById('ab-tm').value || '-', vDekor: document.getElementById('v-ab-dekorasi').value || '-', vMua: document.getElementById('v-ab-mua').value || '-', vKel: document.getElementById('v-ab-keluarga').value || '-', vMc: document.getElementById('v-ab-mc').value || '-', vEnt: document.getElementById('v-ab-ent').value || '-', vCat: document.getElementById('v-ab-catering').value || '-', vDok: document.getElementById('v-ab-dok').value || '-', vSnd: document.getElementById('v-ab-sound').value || '-', vAtr: document.getElementById('v-ab-attire').value || '-', vVen: document.getElementById('v-ab-venue').value || '-', catatan: document.getElementById('ab-catatan').value || '-'
            };

          
            let upgradeArr = [];
            if (document.getElementById('ab-is-upgrade') && document.getElementById('ab-is-upgrade').checked) {
                document.querySelectorAll('.upg-ab-row').forEach(row => {
                    const nm = row.querySelector('.upg-ab-nama').value;
                    const qt = row.querySelector('.upg-ab-qty').value;
                    if (nm) upgradeArr.push(`<li>${nm} (x${qt})</li>`);
                });
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
      

        let globalJadwal = {};
        let globalMasterKru = { mc: [], vocal: [], keyboard: [], sexo: [], wo: [] };
        let currentDateJadwal = new Date();
        let activeJadwalTahun = 'Semua';
        let activeJadwalBulan = 'Semua';

       
        function formatDateIndo(dateStr) {
            if (!dateStr || dateStr === '-') return '-';
            if (dateStr.includes('-')) {
                const parts = dateStr.split('-');
                if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`; 
            }
            return dateStr;
        }

        
        function getValidEventDate(p, berkas) {
            let tgl = (berkas && berkas['Tgl Akad']) ? berkas['Tgl Akad'] : p.Tanggal;
            if (!tgl || tgl === '-') return null;

           
            if (tgl.includes('-')) {
                const parts = tgl.split('T')[0].split('-');
                if (parts[0].length === 4) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
           
            if (tgl.includes('/')) {
                const parts = tgl.split(',')[0].split('/');
                if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
            return new Date(tgl);
        }

        async function fetchJadwalKru(force = false, silent = false) {
            if (!force && dataLoaded.jadwal) return;
            try {
                const [resJadwal, resKru] = await Promise.all([
                    fetch(`${SCRIPT_URL}?action=getJadwal`),
                    fetch(`${SCRIPT_URL}?action=getMasterKru`)
                ]);
                const dataJ = await resJadwal.json();
                const dataK = await resKru.json();

                if (dataJ.status === 'success') {
                    globalJadwal = {};
                    dataJ.data.forEach(j => {
                        globalJadwal[j['ID Booking']] = {
                            pj: j['PJ'], tglTm: j['Tgl TM'], waktuTm: j['Waktu TM'], lokasiTm: j['Lokasi TM'], statusTm: j['Status TM'],
                            mc: j['MC'], vocal: j['Vocal'], keyboard: j['Keyboard'], sexo: j['Saxophone'],
                            wo: j['WO'] ? JSON.parse(j['WO']) : [], keterangan: j['Keterangan']
                        };
                    });
                }
                if (dataK.status === 'success') {
                    globalMasterKru = { mc: [], vocal: [], keyboard: [], sexo: [], wo: [] };
                    dataK.data.forEach(k => {
                        if (globalMasterKru[k.Kategori]) {
                            globalMasterKru[k.Kategori].push({ nama: k.Nama, wa: k['No WA'] || '' });
                        }
                    });
                }
                dataLoaded.jadwal = true;
                populateFilterTahun(); 
            } catch (e) { }
        }

        function populateFilterTahun() {
            const selTahun = document.getElementById('filter-jadwal-tahun');
            let tahunSet = new Set();
            globalPenjualan.forEach(p => {
                if (p['Status Acara'] !== 'Dibatalkan' && p.Status !== 'Dibatalkan') {
                    const berkas = globalBerkas.find(b => b['ID Booking'] === (p['ID Booking'] || p['ID Transaksi'])) || {};
                    let d = getValidEventDate(p, berkas);
                    if (d) tahunSet.add(d.getFullYear());
                }
            });
            let options = '<option value="Semua">Semua Tahun</option>';
            [...tahunSet].sort().reverse().forEach(t => options += `<option value="${t}">${t}</option>`);
            if (selTahun) selTahun.innerHTML = options;

           
            renderFilterBulanJadwal();
        }

        function ubahFilterJadwal() {
            activeJadwalTahun = document.getElementById('filter-jadwal-tahun').value;
            activeJadwalBulan = 'Semua'; 
            
           
            if (activeJadwalTahun !== 'Semua') {
                currentDateJadwal.setFullYear(parseInt(activeJadwalTahun));
            } else {
                currentDateJadwal.setFullYear(new Date().getFullYear());
            }
            currentDateJadwal.setMonth(new Date().getMonth()); 
            

            renderFilterBulanJadwal();
            renderJadwalEvent();
        }

        function setBulanJadwal(bulanVal) {
            activeJadwalBulan = bulanVal;
            
           
            if (activeJadwalTahun !== 'Semua') {
                currentDateJadwal.setFullYear(parseInt(activeJadwalTahun));
            } else {
                currentDateJadwal.setFullYear(new Date().getFullYear());
            }

            if (bulanVal !== 'Semua') {
                currentDateJadwal.setMonth(parseInt(bulanVal) - 1);
            } else {
                currentDateJadwal.setMonth(new Date().getMonth());
            }
           

            renderFilterBulanJadwal();
            renderJadwalEvent(); // (Di dalam renderJadwalEvent sudah otomatis memanggil renderKalenderJadwal)
        }

        function renderFilterBulanJadwal() {
            const container = document.getElementById('filter-jadwal-bulan-container');
            if (!container) return;

            const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
            let validEvents = globalPenjualan.filter(p => p['Status Acara'] !== 'Dibatalkan' && p.Status !== 'Dibatalkan');

            let html = `<button onclick="setBulanJadwal('Semua')" class="shrink-0 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all border relative ${activeJadwalBulan === 'Semua' ? 'bg-gold-500 text-black border-gold-500 shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'bg-[#111] text-zinc-400 border-zinc-800 hover:border-gold-500/50'}">Semua</button>`;

            for (let m = 0; m < 12; m++) {
                let count = 0;
                validEvents.forEach(p => {
                    const berkas = globalBerkas.find(b => b['ID Booking'] === (p['ID Booking'] || p['ID Transaksi']));
                    const d = getValidEventDate(p, berkas);
                    if (d) {
                        let matchTahun = activeJadwalTahun === 'Semua' ? true : d.getFullYear().toString() === activeJadwalTahun;
                        if (matchTahun && d.getMonth() === m) count++;
                    }
                });

                let valBulan = String(m + 1).padStart(2, '0');
                const activeClass = (activeJadwalBulan === valBulan) ? 'bg-gold-500 text-black border-gold-500 shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'bg-[#111] text-zinc-400 border-zinc-800 hover:border-gold-500/50';
                const badge = count > 0 ? `<div class="absolute -top-1.5 -right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow-md border border-black">${count}</div>` : '';

                html += `<button onclick="setBulanJadwal('${valBulan}')" class="shrink-0 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all border relative ${activeClass}">${months[m]}${badge}</button>`;
            }
            container.innerHTML = html;
        }

        function ubahFilterJadwal() {
            activeJadwalTahun = document.getElementById('filter-jadwal-tahun').value;
            activeJadwalBulan = document.getElementById('filter-jadwal-bulan').value;
            renderJadwalEvent();
        }

       
        function getKruWaLink(nama) {
            if (!nama || nama === '-') return nama;
            let wa = '';
            for (const kat in globalMasterKru) {
                const kru = globalMasterKru[kat].find(k => k.nama === nama);
                if (kru && kru.wa) { wa = kru.wa; break; }
            }
            if (wa) {
                return `${nama} <a href="https://wa.me/${wa}" target="_blank" onclick="event.stopPropagation()" class="text-[#25D366] hover:text-white hover:scale-125 transition-all inline-block ml-1" title="Chat WA"><i class="fa-brands fa-whatsapp text-[14px] drop-shadow-md"></i></a>`;
            }
            return nama;
        }

        function renderJadwalEvent() {
            const tbody = document.getElementById('table-jadwal-event');
            let validEvents = globalPenjualan.filter(p => p['Status Acara'] !== 'Dibatalkan' && p.Status !== 'Dibatalkan');

          
            if (activeJadwalTahun !== 'Semua' || activeJadwalBulan !== 'Semua') {
                validEvents = validEvents.filter(p => {
                    const berkas = globalBerkas.find(b => b['ID Booking'] === (p['ID Booking'] || p['ID Transaksi'])) || {};
                    let tgl = berkas['Tgl Akad'] || p.Tanggal;
                    let d = getValidEventDate(p, berkas);
                    if (!d && tgl.includes('-')) d = new Date(tgl);
                    if (!d) return false;

                    let matchTahun = activeJadwalTahun === 'Semua' ? true : d.getFullYear().toString() === activeJadwalTahun;
                    let matchBulan = activeJadwalBulan === 'Semua' ? true : String(d.getMonth() + 1).padStart(2, '0') === activeJadwalBulan;
                    return matchTahun && matchBulan;
                });
            }

            
            document.getElementById('info-jumlah-event').textContent = validEvents.length;

            if (validEvents.length === 0) {
                tbody.innerHTML = `<tr><td colspan="10" class="text-center py-10 text-zinc-500 text-sm">Tidak ada jadwal event.</td></tr>`;
                renderKalenderJadwal(validEvents);
                return;
            }

            tbody.innerHTML = validEvents.map(p => {
                const idTrx = p['ID Booking'] || p['ID Transaksi'];
                const clientNm = p['Username Klien'] || p['Username Pembeli'];
                const berkas = globalBerkas.find(b => b['ID Booking'] === idTrx) || {};
                const jdwl = globalJadwal[idTrx] || {};

                const judulEvent = (berkas['Nama CPP'] && berkas['Nama CPW']) ? `${berkas['Nama CPP']} & ${berkas['Nama CPW']}` : 'Belum isi berkas';

               
                const tglAkad = formatDateIndo(berkas['Tgl Akad'] ? String(berkas['Tgl Akad']).split('T')[0] : '-');
                const jamAkad = berkas['Waktu Akad'] || '-';
                const locAkad = berkas['Vendor Venue'] || '-';

                const tglResepsi = formatDateIndo(berkas['Tgl Resepsi'] ? String(berkas['Tgl Resepsi']).split('T')[0] : '-');
                const jamResepsi = berkas['Waktu Resepsi'] || '-';

                let statusTmUI = `<span class="bg-blue-900/40 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold">Belum</span>`;
                if (jdwl.statusTm === 'Sudah') statusTmUI = `<span class="bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">Sudah</span>`;

               
                let woList = (jdwl.wo && jdwl.wo.length > 0) ? jdwl.wo.map((w, i) => `<span class="bg-orange-900/40 text-orange-300 border border-orange-500/30 px-1.5 py-0.5 rounded text-[10px] mr-1 block mb-1 w-max font-medium">WO${i + 1}: ${getKruWaLink(w)}</span>`).join('') : '-';

             
                const tglTmFormatted = formatDateIndo(jdwl.tglTm || '-');
                const jamTmFormatted = jdwl.waktuTm ? `(${jdwl.waktuTm})` : '';

               
                return `
                <tr class="border-b border-zinc-800/50 hover:brightness-125 transition-all">
                    <td class="px-4 py-3 bg-zinc-900/30"><button onclick="bukaEditJadwal('${idTrx}')" class="bg-gold-500 hover:bg-gold-400 text-black px-3 py-1.5 rounded-lg text-xs font-bold shadow-md"><i class="fa-solid fa-pen mr-1"></i> Edit Jadwal</button></td>
                    <td class="px-4 py-3 text-xs md:text-sm bg-zinc-900/30"><span class="font-mono font-bold text-gold-500 block">${idTrx}</span><span class="text-zinc-300">@${clientNm}</span></td>
                    <td class="px-4 py-3 text-xs md:text-sm font-bold text-white bg-zinc-800/20">${judulEvent}</td>
                    <td class="px-4 py-3 text-xs md:text-sm bg-zinc-800/20">
                        <p class="text-emerald-400 mb-0.5"><b>Akad:</b> ${tglAkad} (${jamAkad})</p>
                        <p class="text-blue-400 mb-0.5"><b>Res:</b> ${tglResepsi} (${jamResepsi})</p>
                        <p class="text-zinc-400 truncate max-w-[180px] text-xs"><i class="fa-solid fa-location-dot"></i> ${locAkad}</p>
                    </td>
                    <td class="px-4 py-3 text-xs md:text-sm text-gold-300 whitespace-normal max-w-[180px] bg-yellow-900/10 leading-tight font-medium">${p['Nama Paket'] || p['Nama Baju']}</td>
                    <td class="px-4 py-3 text-xs md:text-sm font-bold text-blue-400 bg-blue-900/10 text-left">${getKruWaLink(jdwl.pj || '-')}</td>
                    <td class="px-4 py-3 text-xs md:text-sm text-zinc-200 bg-emerald-900/10">
                        <div class="flex justify-between items-center mb-1">
                            <span><b>Tgl:</b> ${tglTmFormatted} ${jamTmFormatted}</span>
                            ${statusTmUI}
                        </div>
                        <span class="block truncate max-w-[180px] text-xs text-zinc-400 mt-1" title="${jdwl.lokasiTm || berkas['Tgl & Lokasi TM'] || '-'}"><i class="fa-solid fa-location-dot text-emerald-500"></i> ${jdwl.lokasiTm || berkas['Tgl & Lokasi TM'] || '-'}</span>
                    </td>
                    <td class="px-4 py-3 text-xs md:text-sm text-purple-200 bg-purple-900/10 leading-relaxed font-medium min-w-[160px]">
                        <span class="text-zinc-400">MC:</span> ${getKruWaLink(jdwl.mc || '-')}<br>
                        <span class="text-zinc-400">Voc:</span> ${getKruWaLink(jdwl.vocal || '-')}<br>
                        <span class="text-zinc-400">Key:</span> ${getKruWaLink(jdwl.keyboard || '-')}<br>
                        <span class="text-zinc-400">Sax:</span> ${getKruWaLink(jdwl.sexo || '-')}
                    </td>
                    <td class="px-4 py-3 text-xs md:text-sm whitespace-normal max-w-[180px] bg-orange-900/10">${woList}</td>
                    <td class="px-4 py-3 text-xs md:text-sm text-zinc-400 whitespace-normal max-w-[150px] italic bg-zinc-900/30">${jdwl.keterangan || '-'}</td>
                </tr>`;
            }).join('');

            renderKalenderJadwal(validEvents);
        }

      
        function switchJadwalView(view) {
            const btnList = document.getElementById('btn-view-jadwal-list');
            const btnCal = document.getElementById('btn-view-jadwal-cal');
            const vList = document.getElementById('view-jadwal-list');
            const vCal = document.getElementById('view-jadwal-kalender');

            if (view === 'list') {
                btnList.className = "bg-gold-500 text-black px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5";
                btnCal.className = "text-zinc-400 hover:text-gold-400 hover:bg-zinc-900 px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-colors flex items-center gap-1.5";
                vList.classList.remove('hidden'); vCal.classList.add('hidden');
            } else {
                btnCal.className = "bg-gold-500 text-black px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5";
                btnList.className = "text-zinc-400 hover:text-gold-400 hover:bg-zinc-900 px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-colors flex items-center gap-1.5";
                vList.classList.add('hidden'); vCal.classList.remove('hidden');
            }
        }

       
        function ubahBulanJadwal(offset) {
            currentDateJadwal.setMonth(currentDateJadwal.getMonth() + offset);
            document.getElementById('jadwal-kalender-detail-container').classList.add('hidden');
            renderJadwalEvent();
        }

        function renderKalenderJadwal(validEvents) {
            const year = currentDateJadwal.getFullYear();
            const month = currentDateJadwal.getMonth();
            const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

            document.getElementById('jadwal-kalender-title').textContent = `${monthNames[month]} ${year}`;

            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const grid = document.getElementById('jadwal-kalender-grid');
            grid.innerHTML = '';

            const mapJadwal = {};
            validEvents.forEach(p => {
                const idTrx = p['ID Booking'] || p['ID Transaksi'];
                const berkas = globalBerkas.find(b => b['ID Booking'] === idTrx) || {};
                
                let tglAkadStr = berkas['Tgl Akad'] ? String(berkas['Tgl Akad']).split('T')[0] : '';
                let tglResepsiStr = berkas['Tgl Resepsi'] ? String(berkas['Tgl Resepsi']).split('T')[0] : '';

                
                let validDates = [];
                if(tglAkadStr) validDates.push(new Date(tglAkadStr));
                if(tglResepsiStr && tglResepsiStr !== tglAkadStr) validDates.push(new Date(tglResepsiStr));

                validDates.forEach(d => {
                    if (d.getFullYear() === year && d.getMonth() === month) {
                        let tglKey = d.getDate();
                        if (!mapJadwal[tglKey]) mapJadwal[tglKey] = [];
                        mapJadwal[tglKey].push({ p: p, b: berkas });
                    }
                });
            });

            for (let i = 0; i < firstDay; i++) grid.innerHTML += `<div class="p-2 md:p-4 rounded-xl bg-black/20 border border-transparent"></div>`;

            let today = new Date();
            for (let i = 1; i <= daysInMonth; i++) {
                let isToday = (i === today.getDate() && month === today.getMonth() && year === today.getFullYear());
                let events = mapJadwal[i] || [];
                let hasEvent = events.length > 0;

                let extraClass = "bg-black border-zinc-800 text-zinc-300 hover:bg-zinc-800";
                let badge = ""; let countText = "";

                if (hasEvent) {
                    extraClass = "bg-gold-500/20 border-gold-500/50 text-gold-400 hover:bg-gold-500/30 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-transform hover:scale-105 active:scale-95 z-10";
                    countText = `<p class="text-[8px] md:text-[9px] font-medium text-gold-200 truncate mt-0.5 hidden sm:block">${events.length} Jadwal</p>`;
                    badge = `<div class="absolute -top-1.5 -right-1.5 w-4 h-4 md:w-5 md:h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold shadow-md border border-black">${events.length}</div>`;
                } else if (isToday) {
                    extraClass = "bg-blue-900/20 border-blue-500/30 text-blue-400";
                }

                let paramDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                grid.innerHTML += `<div ${hasEvent ? `onclick="lihatDetailKalenderJadwal('${paramDate}')"` : ''} class="relative p-2 md:p-3 rounded-xl md:rounded-2xl border flex flex-col items-center justify-center min-h-[44px] md:min-h-[64px] transition-colors ${extraClass}"><span class="text-xs md:text-sm font-bold ${isToday && !hasEvent ? 'text-blue-400' : ''}">${i}</span>${countText}${badge}</div>`;
            }
        }

        function lihatDetailKalenderJadwal(dateStr) {
            const targetDate = new Date(dateStr);
            document.getElementById('jadwal-kalender-tgl-terpilih').textContent = targetDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

            const listContainer = document.getElementById('jadwal-kalender-list-acara');
            let html = '';

            const validEvents = globalPenjualan.filter(p => p['Status Acara'] !== 'Dibatalkan' && p.Status !== 'Dibatalkan');
           let acaraHariIni = validEvents.filter(p => {
                const berkas = globalBerkas.find(b => b['ID Booking'] === (p['ID Booking'] || p['ID Transaksi'])) || {};
                let tglAkadStr = berkas['Tgl Akad'] ? String(berkas['Tgl Akad']).split('T')[0] : '';
                let tglResepsiStr = berkas['Tgl Resepsi'] ? String(berkas['Tgl Resepsi']).split('T')[0] : '';
                
                return tglAkadStr === dateStr || tglResepsiStr === dateStr;
            });

            acaraHariIni.forEach(p => {
                const idTrx = p['ID Booking'] || p['ID Transaksi'];
                const nmPkt = p['Nama Paket'] || p['Nama Baju'];
                const clientNm = p['Username Klien'] || p['Username Pembeli'];
                const jdwl = globalJadwal[idTrx] || {};

                html += `
                    <div class="bg-black p-3 md:p-4 rounded-xl border border-zinc-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div>
                            <span class="text-[9px] md:text-[10px] font-mono font-bold text-gold-500 block">${idTrx} &bull; @${clientNm}</span>
                            <h5 class="font-bold text-white text-sm mt-1">${nmPkt}</h5>
                            <p class="text-[10px] text-zinc-400 mt-1"><b>PJ:</b> ${jdwl.pj || '-'} | <b>MC:</b> ${jdwl.mc || '-'}</p>
                        </div>
                        <button onclick="bukaEditJadwal('${idTrx}')" class="bg-gold-500 hover:bg-gold-400 text-black px-4 py-2 rounded-lg text-[10px] font-bold shadow-md w-full md:w-auto transition"><i class="fa-solid fa-pen mr-1"></i> Atur Jadwal & Kru</button>
                    </div>`;
            });

            listContainer.innerHTML = html;
            document.getElementById('jadwal-kalender-detail-container').classList.remove('hidden');
            setTimeout(() => document.getElementById('jadwal-kalender-detail-container').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
        }


        function toggleModalEditJadwal() {
            const modal = document.getElementById('modal-edit-jadwal');
            if (modal.classList.contains('opacity-0')) { modal.classList.remove('opacity-0', 'pointer-events-none'); setTimeout(() => modal.classList.add('show'), 10); }
            else { modal.classList.remove('show'); setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); }, 300); }
        }

       function populateSelectOptions(selId, masterType, selectedVal) {
            const sel = document.getElementById(selId);
            sel.innerHTML = `<option value="">-- Pilih --</option>` + globalMasterKru[masterType].map(v => `<option value="${v.nama}">${v.nama}</option>`).join('');
            if (selectedVal && globalMasterKru[masterType].some(v => v.nama === selectedVal)) sel.value = selectedVal;
        }

        function bukaEditJadwal(idTrx) {
            const p = globalPenjualan.find(x => (x['ID Booking'] || x['ID Transaksi']) === idTrx);
            const berkas = globalBerkas.find(b => b['ID Booking'] === idTrx) || {};
            const jdwl = globalJadwal[idTrx] || {};

            document.getElementById('ej-id-booking').value = idTrx;
            document.getElementById('ej-info-klien').textContent = `@${p['Username Klien'] || p['Username Pembeli']}`;
            document.getElementById('ej-info-judul').textContent = (berkas['Nama CPP'] && berkas['Nama CPW']) ? `${berkas['Nama CPP']} & ${berkas['Nama CPW']}` : 'Belum diisi';
            document.getElementById('ej-info-paket').textContent = p['Nama Paket'] || p['Nama Baju'];
            document.getElementById('ej-info-tgl').textContent = formatDateIndo(berkas['Tgl Akad'] ? String(berkas['Tgl Akad']).split('T')[0] : '-');

            document.getElementById('ej-pj').value = jdwl.pj || '';
            document.getElementById('ej-tgl-tm').value = jdwl.tglTm || '';
           
            document.getElementById('ej-wkt-tm').value = jdwl.waktuTm || '';
            document.getElementById('ej-lokasi-tm').value = jdwl.lokasiTm || berkas['Tgl & Lokasi TM'] || '';
            document.getElementById('ej-status-tm').value = jdwl.statusTm || 'Belum';
            document.getElementById('ej-keterangan').value = jdwl.keterangan || '';

            populateSelectOptions('ej-mc', 'mc', jdwl.mc);
            populateSelectOptions('ej-vocal', 'vocal', jdwl.vocal);
            populateSelectOptions('ej-keyboard', 'keyboard', jdwl.keyboard);
            populateSelectOptions('ej-sexo', 'sexo', jdwl.sexo);

            const contWo = document.getElementById('ej-container-wo');
            contWo.innerHTML = '';
            if (jdwl.wo && jdwl.wo.length > 0) {
                jdwl.wo.forEach(val => tambahBarisWO(val));
            } else {
                tambahBarisWO();
            }

            toggleModalEditJadwal();
        }

       function tambahBarisWO(val = '') {
            const cont = document.getElementById('ej-container-wo');
            const num = cont.children.length + 1;
            const div = document.createElement('div');
            div.className = "flex gap-2 items-center wo-row";

            let options = `<option value="">-- Pilih Kru WO --</option>` + globalMasterKru.wo.map(v => `<option value="${v.nama}" ${v.nama === val ? 'selected' : ''}>${v.nama}</option>`).join('');

            div.innerHTML = `
                <span class="text-[10px] text-zinc-500 font-bold w-8">WO${num}</span>
                <select class="wo-sel flex-1 bg-black border border-zinc-700 rounded px-2 py-1 text-[10px] text-white outline-none focus:border-orange-500">${options}</select>
                <button type="button" onclick="this.parentElement.remove()" class="text-zinc-500 hover:text-red-500 w-5 h-5 flex items-center justify-center"><i class="fa-solid fa-times text-[10px]"></i></button>
            `;
            cont.appendChild(div);
        }

        async function simpanJadwalEvent() {
            const idTrx = document.getElementById('ej-id-booking').value;
            const btn = event.target;
            const oriText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';
            btn.disabled = true;

            let woArr = [];
            document.querySelectorAll('.wo-sel').forEach(el => { if (el.value) woArr.push(el.value); });

            const payload = {
                action: "saveJadwal",
                id_booking: idTrx,
                pj: document.getElementById('ej-pj').value,
                tgl_tm: document.getElementById('ej-tgl-tm').value,
                waktu_tm: document.getElementById('ej-wkt-tm').value,     
                lokasi_tm: document.getElementById('ej-lokasi-tm').value, 
                status_tm: document.getElementById('ej-status-tm').value,
                mc: document.getElementById('ej-mc').value,
                vocal: document.getElementById('ej-vocal').value,
                keyboard: document.getElementById('ej-keyboard').value,
                sexo: document.getElementById('ej-sexo').value,
                keterangan: document.getElementById('ej-keterangan').value,
                wo: JSON.stringify(woArr)
            };

            try {
               const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload),headers: { 'Content-Type': 'text/plain' } });
                const data = await res.json();
                if (data.status === 'success') {
                    await fetchJadwalKru(true);
                    renderJadwalEvent();
                    toggleModalEditJadwal();
                    alert("Penugasan & Jadwal Tersimpan!");
                } else alert("Gagal menyimpan: " + data.message);
            } catch (e) { alert("Kesalahan koneksi!"); }
            finally { btn.innerHTML = oriText; btn.disabled = false; }
        }

    
        function bukaModalMasterKru() {
            const modal = document.getElementById('modal-master-kru');
            if (modal.classList.contains('opacity-0')) {
                modal.classList.remove('opacity-0', 'pointer-events-none'); setTimeout(() => modal.classList.add('show'), 10);
                renderMasterKruList();
            } else { modal.classList.remove('show'); setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); }, 300); }
        }

       function renderMasterKruList() {
            const kat = document.getElementById('mk-kategori').value;
            const ul = document.getElementById('mk-list');
            const data = globalMasterKru[kat] || [];

            if (data.length === 0) {
                ul.innerHTML = `<li class="text-center text-[10px] text-zinc-500 py-4">Belum ada data.</li>`;
                return;
            }

            ul.innerHTML = data.map((kru, idx) => {
                
                let waHtml = `<span class="text-[10px] text-zinc-600 font-mono flex items-center gap-1"><i class="fa-brands fa-whatsapp text-zinc-700"></i> Tidak ada WA</span>`;
                
                if (kru.wa && kru.wa !== '-' && kru.wa !== '') {
                    waHtml = `<a href="https://wa.me/${kru.wa}" target="_blank" onclick="event.stopPropagation()" class="text-[10px] text-zinc-400 font-mono hover:text-[#25D366] transition-colors flex items-center gap-1 w-max" title="Chat WA ${kru.nama}">
                                <i class="fa-brands fa-whatsapp text-[#25D366]"></i> ${kru.wa}
                              </a>`;
                }

                return `
                <li class="flex justify-between items-center bg-[#111] border border-zinc-800 p-2.5 rounded-lg hover:border-zinc-600 transition-colors">
                    <div class="flex flex-col gap-1">
                        <span class="text-xs font-bold text-zinc-200">${kru.nama}</span>
                        ${waHtml}
                    </div>
                    <button onclick="hapusMasterKru('${kat}', ${idx})" class="text-zinc-500 bg-zinc-900 border border-zinc-800 hover:border-red-500/50 hover:bg-red-900/30 hover:text-red-500 w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm">
                        <i class="fa-solid fa-trash text-[10px]"></i>
                    </button>
                </li>
                `;
            }).join('');
        }

       async function tambahMasterKru() {
            const kat = document.getElementById('mk-kategori').value;
            const iptNama = document.getElementById('mk-nama-baru');
            const iptWa = document.getElementById('mk-wa-baru');
            const btn = document.getElementById('btn-add-kru');

            const valNama = iptNama.value.trim();
            let valWa = iptWa.value.trim();
            if (!valNama) return;

           
            if (valWa.startsWith('0')) valWa = '62' + valWa.substring(1);
            else if (valWa.startsWith('+62')) valWa = '62' + valWa.substring(3);

            const cekAda = globalMasterKru[kat]?.find(k => k.nama.toLowerCase() === valNama.toLowerCase());
            if (cekAda) { alert("Nama kru tersebut sudah ada di kategori ini!"); return; }

            iptNama.disabled = true; iptWa.disabled = true; btn.disabled = true;
            const oriBtnHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';

            const payload = { action: "addMasterKru", kategori: kat, nama: valNama, no_wa: valWa };
            try {
                const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain' } });
                const data = await res.json();
                if (data.status === 'success') {
                    if (!globalMasterKru[kat]) globalMasterKru[kat] = [];
                    globalMasterKru[kat].push({ nama: valNama, wa: valWa });
                    iptNama.value = ""; iptWa.value = "";
                    renderMasterKruList();
                } else alert("Gagal: " + data.message);
            } catch (e) {
                alert("Gagal koneksi ke server saat menyimpan kru.");
            } finally {
                iptNama.disabled = false; iptWa.disabled = false; btn.disabled = false; btn.innerHTML = oriBtnHtml;
            }
        }

       async function hapusMasterKru(kat, idx) {
            if (!confirm("Hapus data kru ini?")) return;
            const kru = globalMasterKru[kat][idx];

            const payload = { action: "deleteMasterKru", kategori: kat, nama: kru.nama };
            try {
              const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain' } });
                const data = await res.json();
                if (data.status === 'success') {
                    globalMasterKru[kat].splice(idx, 1);
                    renderMasterKruList();
                } else alert(data.message);
            } catch (e) { alert("Gagal koneksi"); }
        }


     

        async function fetchCatatanHNP(force = false, silent = false) {
            if (!force && globalCatatanHNP.length > 0) return;
            try {
                const res = await fetch(`${SCRIPT_URL}?action=getCatatanHNP`);
                const data = await res.json();
                if (data.status === 'success') {
                    globalCatatanHNP = data.data;
                }
            } catch (e) { }
        }

        function ubahBulanHNP(offset) {
            currentDateHNP.setMonth(currentDateHNP.getMonth() + offset);
            renderKalenderHNP();
        }

      function renderKalenderHNP() {
            const year = currentDateHNP.getFullYear();
            const month = currentDateHNP.getMonth();
            const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            
            document.getElementById('hnp-kalender-title').textContent = `${monthNames[month]} ${year}`;

            const firstDay = new Date(year, month, 1).getDay(); 
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const grid = document.getElementById('hnp-kalender-grid');
            grid.innerHTML = '';

            for (let i = 0; i < firstDay; i++) grid.innerHTML += `<div class="p-2 md:p-3 rounded-xl bg-black/20 border border-transparent"></div>`;

            let today = new Date();
            const validEvents = globalPenjualan.filter(p => p['Status Acara'] !== 'Dibatalkan' && p.Status !== 'Dibatalkan');

            for (let i = 1; i <= daysInMonth; i++) {
                let isToday = (i === today.getDate() && month === today.getMonth() && year === today.getFullYear());
                let paramDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                
                
                let noteObj = globalCatatanHNP.find(c => c.Tanggal === paramDate);
                let catatanHtml = noteObj ? `<div class="mt-1 text-[9px] md:text-[10px] text-zinc-300 font-medium whitespace-pre-wrap leading-tight text-left w-full border-t border-zinc-800/50 pt-1">${noteObj.Catatan}</div>` : '';

                
                let tmHtml = '';
                let eventHtml = '';

                validEvents.forEach(p => {
                    const idTrx = p['ID Booking'] || p['ID Transaksi'];
                    const user = p['Username Klien'] || p['Username Pembeli'];
                    const jdwl = globalJadwal[idTrx] || {};
                    const berkas = globalBerkas.find(b => b['ID Booking'] === idTrx) || {};
                    
                  
                    if (jdwl.tglTm === paramDate) {
                        const wkt = jdwl.waktuTm || '-';
                        const lok = jdwl.lokasiTm || '-';
                        const stat = jdwl.statusTm || 'Belum';
                        const color = stat === 'Sudah' ? 'bg-emerald-600/80 border-emerald-500' : 'bg-blue-600/80 border-blue-500';
                        
                        tmHtml += `
                        <div onclick="event.stopPropagation(); bukaEditTmHNP('${idTrx}')" class="mt-1 p-1.5 rounded-lg text-[9px] text-white border ${color} cursor-pointer hover:opacity-80 transition leading-tight w-full text-left shadow-sm">
                            <span class="font-bold">TM @${user}</span><br>
                            <span class="text-[8px] text-zinc-200">${wkt} | ${lok}</span>
                        </div>`;
                    }

                
                    let tglAkadStr = berkas['Tgl Akad'] ? String(berkas['Tgl Akad']).split('T')[0] : '';
                    let tglResepsiStr = berkas['Tgl Resepsi'] ? String(berkas['Tgl Resepsi']).split('T')[0] : '';

                    if (tglAkadStr === paramDate || tglResepsiStr === paramDate) {
                        let labelAcara = [];
                        if (tglAkadStr === paramDate) labelAcara.push("AKAD");
                        if (tglResepsiStr === paramDate && tglResepsiStr !== tglAkadStr) labelAcara.push("RESEPSI");
                        else if (tglResepsiStr === paramDate && tglResepsiStr === tglAkadStr) labelAcara = ["AKAD & RESEPSI"];

                        let waktuAcara = (tglAkadStr === paramDate) ? (berkas['Waktu Akad'] || '-') : (berkas['Waktu Resepsi'] || '-');
                        let venue = berkas['Vendor Venue'] || '-';
                        let tglIndo = formatDateIndo(paramDate);
                        let kruHtml = generateKruWaLinks(idTrx);

                        eventHtml += `
                        <div class="mt-2 p-3 rounded-xl border border-gold-500/40 bg-[#111] leading-tight w-full text-left shadow-lg">
                            <div class="flex justify-between items-start mb-2">
                                <span class="font-bold uppercase text-gold-400 text-[10px]"><i class="fa-solid fa-ring mr-1"></i> ${labelAcara.join(' & ')} @${user}</span>
                                <span class="text-[8px] bg-gold-500 text-black px-1.5 py-0.5 rounded font-bold">${tglIndo}</span>
                            </div>
                            <span class="text-[10px] text-zinc-300 mt-1 block"><i class="fa-regular fa-clock w-4 text-zinc-500 text-center"></i> Pukul: ${waktuAcara}</span>
                            <span class="text-[10px] text-zinc-300 block mt-1"><i class="fa-solid fa-location-dot w-4 text-zinc-500 text-center"></i> Venue: ${venue}</span>
                            ${kruHtml}
                        </div>`;
                    }
                });

               grid.innerHTML += `
                <div onclick="bukaDetailHNP('${paramDate}')" 
                     class="relative p-2 md:p-3 rounded-xl border flex flex-col items-start justify-start min-h-[80px] md:min-h-[100px] transition-colors cursor-pointer group bg-black border-zinc-800 hover:border-gold-500/50 hover:bg-zinc-900/50">
                    <span class="text-xs md:text-sm font-bold ${isToday ? 'text-gold-500 bg-gold-500/20 px-2 py-0.5 rounded' : 'text-zinc-400 group-hover:text-gold-400'}">${i}</span>
                    <div class="flex flex-col w-full gap-1 mt-1 pointer-events-none">${eventHtml}${tmHtml}${catatanHtml}</div>
                </div>`;
            }
        }

        function toggleModalDetailHNP() {
            const modal = document.getElementById('modal-detail-hnp');
            if (modal.classList.contains('opacity-0')) { 
                modal.classList.remove('opacity-0', 'pointer-events-none'); 
                setTimeout(() => modal.classList.add('show'), 10); 
            } else { 
                modal.classList.remove('show'); 
                setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); }, 300); 
            }
        }

        function generateKruWaLinks(idTrx) {
            const jdwl = globalJadwal[idTrx] || {};
            let links = [];
            
            const addLink = (role, nama) => {
                if(!nama || nama === '-') return;
                let wa = '';
                for(const kat in globalMasterKru) {
                    const kru = globalMasterKru[kat].find(k => k.nama === nama);
                    if(kru && kru.wa) { wa = kru.wa; break; }
                }
                if(wa) {
                    links.push(`<a href="https://wa.me/${wa}" target="_blank" onclick="event.stopPropagation()" class="inline-flex items-center gap-1.5 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 px-2 py-1 rounded-md text-[9px] font-bold hover:bg-[#25D366] hover:text-white transition shadow-sm"><i class="fa-brands fa-whatsapp text-[11px]"></i> ${role}: ${nama}</a>`);
                } else {
                    links.push(`<span class="inline-flex items-center gap-1.5 bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-1 rounded-md text-[9px] font-bold"><i class="fa-solid fa-user text-[11px]"></i> ${role}: ${nama}</span>`);
                }
            };

            addLink('PJ', jdwl.pj);
            addLink('MC', jdwl.mc);
            addLink('Voc', jdwl.vocal);
            addLink('Key', jdwl.keyboard);
            addLink('Sax', jdwl.sexo);
            
            if(jdwl.wo && jdwl.wo.length > 0) {
                jdwl.wo.forEach((w, i) => addLink(`WO${i+1}`, w));
            }
            
            if(links.length === 0) return '<p class="text-[9px] text-zinc-500 italic mt-2 border-t border-zinc-800 pt-2">Belum ada kru ditugaskan.</p>';
            return `<div class="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-zinc-800/80">${links.join('')}</div>`;
        }

        function bukaDetailHNP(dateStr) {
            const targetDate = new Date(dateStr);
            const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
            document.getElementById('hnp-detail-tgl').textContent = targetDate.toLocaleDateString('id-ID', options);
            document.getElementById('hnp-tgl-input').value = dateStr;

           
            let noteObj = globalCatatanHNP.find(c => c.Tanggal === dateStr);
            document.getElementById('hnp-catatan-input').value = noteObj ? noteObj.Catatan : '';

           
            const validEvents = globalPenjualan.filter(p => p['Status Acara'] !== 'Dibatalkan' && p.Status !== 'Dibatalkan');
            let htmlWedding = '';
            let htmlTM = '';

            validEvents.forEach(p => {
                const idTrx = p['ID Booking'] || p['ID Transaksi'];
                const user = p['Username Klien'] || p['Username Pembeli'];
                const jdwl = globalJadwal[idTrx] || {};
                const berkas = globalBerkas.find(b => b['ID Booking'] === idTrx) || {};

                
                let tglAkadStr = berkas['Tgl Akad'] ? String(berkas['Tgl Akad']).split('T')[0] : '';
                let tglResepsiStr = berkas['Tgl Resepsi'] ? String(berkas['Tgl Resepsi']).split('T')[0] : '';

                if (tglAkadStr === dateStr || tglResepsiStr === dateStr) {
                    let labelAcara = [];
                    if (tglAkadStr === dateStr) labelAcara.push("AKAD");
                    if (tglResepsiStr === dateStr && tglResepsiStr !== tglAkadStr) labelAcara.push("RESEPSI");
                    else if (tglResepsiStr === dateStr && tglResepsiStr === tglAkadStr) labelAcara = ["AKAD & RESEPSI"];

                    let waktuAcara = (tglAkadStr === dateStr) ? (berkas['Waktu Akad'] || '-') : (berkas['Waktu Resepsi'] || '-');
                    let venue = berkas['Vendor Venue'] || '-';
                    let kruHtml = generateKruWaLinks(idTrx);

                    htmlWedding += `
                    <div class="mt-2 p-3 rounded-xl border border-gold-500/40 bg-[#111] leading-tight w-full text-left shadow-lg">
                        <div class="flex justify-between items-start mb-2">
                            <span class="font-bold uppercase text-gold-400 text-[10px]"><i class="fa-solid fa-ring mr-1"></i> ${labelAcara.join(' & ')} @${user}</span>
                            <span class="text-[8px] bg-gold-500 text-black px-1.5 py-0.5 rounded font-bold">${idTrx}</span>
                        </div>
                        <span class="text-[10px] text-zinc-300 mt-1 block"><i class="fa-regular fa-clock w-4 text-zinc-500 text-center"></i> Pukul: ${waktuAcara}</span>
                        <span class="text-[10px] text-zinc-300 block mt-1"><i class="fa-solid fa-location-dot w-4 text-zinc-500 text-center"></i> Venue: ${venue}</span>
                        ${kruHtml}
                    </div>`;
                }

               
                if (jdwl.tglTm === dateStr) {
                    const wkt = jdwl.waktuTm || '-';
                    const lok = jdwl.lokasiTm || '-';
                    const stat = jdwl.statusTm || 'Belum';
                    const isSudah = stat === 'Sudah';
                    const colorUI = isSudah ? 'text-emerald-400 bg-emerald-900/20 border-emerald-500/40' : 'text-blue-400 bg-blue-900/20 border-blue-500/40';
                    const statBadge = isSudah ? 'bg-emerald-600 text-black' : 'bg-blue-600 text-white';

                    htmlTM += `
                    <div onclick="toggleModalDetailHNP(); setTimeout(()=>bukaEditTmHNP('${idTrx}'), 300)" class="${colorUI} border p-3 rounded-xl cursor-pointer hover:brightness-125 transition-colors shadow-sm relative overflow-hidden group mt-2">
                        <div class="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"><i class="fa-solid fa-chevron-right"></i></div>
                        <div class="flex justify-between items-start mb-1 pr-6">
                            <p class="font-bold text-sm"><i class="fa-solid fa-handshake mr-1"></i> TM @${user}</p>
                            <span class="text-[9px] px-2 py-0.5 rounded ${statBadge} font-bold uppercase">${stat}</span>
                        </div>
                        <p class="text-[10px] text-zinc-400 mb-1 font-mono">ID: ${idTrx}</p>
                        <p class="text-xs text-white"><i class="fa-regular fa-clock mr-1 text-zinc-500"></i> ${wkt} | <i class="fa-solid fa-location-dot mx-1 text-zinc-500"></i> ${lok}</p>
                    </div>`;
                }
            });

            if(htmlWedding === '') htmlWedding = '<p class="text-xs text-zinc-600 italic bg-black p-3 rounded-lg border border-zinc-800">Tidak ada event wedding dijadwalkan.</p>';
            if(htmlTM === '') htmlTM = '<p class="text-xs text-zinc-600 italic bg-black p-3 rounded-lg border border-zinc-800">Tidak ada agenda TM dijadwalkan.</p>';

            document.getElementById('hnp-detail-wedding').innerHTML = htmlWedding;
            document.getElementById('hnp-detail-tm').innerHTML = htmlTM;

            toggleModalDetailHNP();
        }

       
        function toggleModalCatatanHNP() {
            const modal = document.getElementById('modal-catatan-hnp');
            if (modal.classList.contains('opacity-0')) { modal.classList.remove('opacity-0', 'pointer-events-none'); setTimeout(() => modal.classList.add('show'), 10); }
            else { modal.classList.remove('show'); setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); }, 300); }
        }

        function bukaModalCatatanHNP(tgl, catLama) {
            document.getElementById('hnp-tgl-input').value = tgl;
            document.getElementById('hnp-tgl-label').textContent = "Tanggal: " + tgl;
            document.getElementById('hnp-catatan-input').value = catLama;
            toggleModalCatatanHNP();
        }

        async function simpanCatatanHNP() {
            const btn = document.getElementById('btn-simpan-hnp');
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...'; btn.disabled = true;

            const tgl = document.getElementById('hnp-tgl-input').value;
            const cat = document.getElementById('hnp-catatan-input').value;

            try {
                const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "saveCatatanHNP", tanggal: tgl, catatan: cat }),headers: { 'Content-Type': 'text/plain' }});
                const data = await res.json();
                if (data.status === 'success') {
                   
                    let idx = globalCatatanHNP.findIndex(c => c.Tanggal === tgl);
                    if (cat === "") { if (idx !== -1) globalCatatanHNP.splice(idx, 1); }
                    else { if (idx !== -1) globalCatatanHNP[idx].Catatan = cat; else globalCatatanHNP.push({ Tanggal: tgl, Catatan: cat }); }

                   renderKalenderHNP();
                    toggleModalDetailHNP();
                }
            } catch (e) { alert("Gagal koneksi"); }
            btn.innerHTML = 'Simpan Catatan'; btn.disabled = false;
        }

       
        function toggleModalTmHNP() {
            const modal = document.getElementById('modal-edit-tm-hnp');
            if (modal.classList.contains('opacity-0')) { modal.classList.remove('opacity-0', 'pointer-events-none'); setTimeout(() => modal.classList.add('show'), 10); }
            else { modal.classList.remove('show'); setTimeout(() => { modal.classList.add('opacity-0', 'pointer-events-none'); }, 300); }
        }

        function bukaEditTmHNP(idTrx) {
            const p = globalPenjualan.find(x => (x['ID Booking'] || x['ID Transaksi']) === idTrx);
            const jdwl = globalJadwal[idTrx] || {};

            document.getElementById('hnp-tm-id').value = idTrx;
            document.getElementById('hnp-tm-klien').textContent = `Klien: @${p['Username Klien'] || p['Username Pembeli']}`;
            document.getElementById('hnp-tm-tgl').value = jdwl.tglTm || '';
            document.getElementById('hnp-tm-wkt').value = jdwl.waktuTm || '';
            document.getElementById('hnp-tm-lok').value = jdwl.lokasiTm || '';
            document.getElementById('hnp-tm-stat').value = jdwl.statusTm || 'Belum';

            toggleModalTmHNP();
        }

        async function simpanTmHNP() {
            const idTrx = document.getElementById('hnp-tm-id').value;
            const btn = document.getElementById('btn-simpan-tm-hnp');
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...'; btn.disabled = true;

           
            const jdwlLama = globalJadwal[idTrx] || {};

            const payload = {
                action: "saveJadwal",
                id_booking: idTrx,
                pj: jdwlLama.pj || '',
                mc: jdwlLama.mc || '',
                vocal: jdwlLama.vocal || '',
                keyboard: jdwlLama.keyboard || '',
                sexo: jdwlLama.sexo || '',
                keterangan: jdwlLama.keterangan || '',
                wo: JSON.stringify(jdwlLama.wo || []),
              
                tgl_tm: document.getElementById('hnp-tm-tgl').value,
                waktu_tm: document.getElementById('hnp-tm-wkt').value,
                lokasi_tm: document.getElementById('hnp-tm-lok').value,
                status_tm: document.getElementById('hnp-tm-stat').value
            };

            try {
                const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload),headers: { 'Content-Type': 'text/plain' } });
                const data = await res.json();
                if (data.status === 'success') {
                   
                    if (!globalJadwal[idTrx]) globalJadwal[idTrx] = {};
                    globalJadwal[idTrx].tglTm = payload.tgl_tm;
                    globalJadwal[idTrx].waktuTm = payload.waktu_tm;
                    globalJadwal[idTrx].lokasiTm = payload.lokasi_tm;
                    globalJadwal[idTrx].statusTm = payload.status_tm;

                    renderKalenderHNP(); 
                    if (!document.getElementById('sec-jadwal').classList.contains('hidden')) renderJadwalEvent(); // Update UI tabel jadwal jika diperlukan
                    toggleModalTmHNP();
                } else alert("Gagal: " + data.message);
            } catch (e) { alert("Gagal koneksi"); }
            btn.innerHTML = 'Simpan Info TM'; btn.disabled = false;
        }

        window.onload = initApp;

