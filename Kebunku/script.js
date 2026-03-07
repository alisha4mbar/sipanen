// --- FORMAT TANGGAL ---
function setTanggal() {
    const opsi = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
    const tanggal = new Date().toLocaleDateString('id-ID', opsi);
    document.getElementById('tanggalHariIni').textContent = tanggal;
}
setTanggal();

// --- DATA OFFLINE ---
let dataPanen = JSON.parse(localStorage.getItem('dataPanen')) || [];

// --- VARIABEL GLOBAL GRAFIK ---
let chartMusimInstance = null;

// --- FUNGSI UPDATE DASHBOARD UTAMA ---
function updateDashboard() {
    const statInput = document.getElementById('statInput');
    const statJenis = document.getElementById('statJenis');
    const statBerat = document.getElementById('statBerat');
    const summaryList = document.getElementById('summaryList');

    let totalBerat = 0;
    const stokTerkumpul = {};

    dataPanen.forEach(item => {
        totalBerat += item.jumlah;
        const namaNormal = item.nama; 
        if (!stokTerkumpul[namaNormal]) { stokTerkumpul[namaNormal] = 0; }
        stokTerkumpul[namaNormal] += item.jumlah;
    });

    const jenisCount = Object.keys(stokTerkumpul).length;

    statInput.textContent = dataPanen.length;
    statJenis.textContent = jenisCount;
    statBerat.textContent = totalBerat % 1 === 0 ? totalBerat : totalBerat.toFixed(1);

    summaryList.innerHTML = '';
    if (jenisCount === 0) {
        summaryList.innerHTML = '<div class="summary-empty">Belum ada data produksi</div>';
    } else {
        Object.keys(stokTerkumpul).forEach(nama => {
            const div = document.createElement('div');
            div.className = 'summary-item';
            const beratFormat = stokTerkumpul[nama] % 1 === 0 ? stokTerkumpul[nama] : stokTerkumpul[nama].toFixed(1);
            div.innerHTML = `<span>${nama}</span> <span>${beratFormat} kg</span>`;
            summaryList.appendChild(div);
        });
    }
}

// --- FUNGSI RENDER MODAL DATA ---
function renderModalData() {
    const daftarRiwayat = document.getElementById('daftarRiwayat');
    const daftarStok = document.getElementById('daftarStok');
    
    if (daftarRiwayat) daftarRiwayat.innerHTML = '';
    if (daftarStok) daftarStok.innerHTML = '';

    if (dataPanen.length === 0) {
        if (daftarRiwayat) daftarRiwayat.innerHTML = '<p style="text-align:center; color:#888; font-size:12px;">Belum ada log panen.</p>';
        if (daftarStok) daftarStok.innerHTML = '<p style="text-align:center; color:#888; font-size:12px;">Produktivitas masih 0.</p>';
        return;
    }

    [...dataPanen].reverse().forEach(item => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <div style="flex:1;">
                <h4>${item.nama}</h4>
                <div class="badge-container">
                    <span class="badge badge-season">${item.musim}</span>
                    <span class="badge badge-block"><i class="fa-solid fa-location-dot"></i> ${item.blok}</span>
                </div>
                <p><i class="fa-regular fa-clock"></i> ${item.waktu}</p>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                <strong style="color:#2ecc71; font-size:16px;">${item.jumlah} kg</strong>
                <button class="btn-del" onclick="hapusData(${item.id})"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
        if (daftarRiwayat) daftarRiwayat.appendChild(div);
    });

    const stokTerkumpul = {};
    dataPanen.forEach(item => {
        if (!stokTerkumpul[item.nama]) stokTerkumpul[item.nama] = 0;
        stokTerkumpul[item.nama] += item.jumlah;
    });

    Object.keys(stokTerkumpul).forEach(nama => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.style.borderLeftColor = '#2ecc71';
        const beratFormat = stokTerkumpul[nama] % 1 === 0 ? stokTerkumpul[nama] : stokTerkumpul[nama].toFixed(1);
        div.innerHTML = `
            <div><h4>${nama}</h4><p>Total Yield/Produksi</p></div>
            <strong style="font-size:16px;">${beratFormat} kg</strong>
        `;
        if (daftarStok) daftarStok.appendChild(div);
    });
}

// --- FUNGSI RENDER GRAFIK MUSIM (BAR CHART) ---
function renderGrafik() {
    const canvas = document.getElementById('grafikMusim');
    if (!canvas) return; // Mencegah error jika canvas tidak ditemukan
    const ctx = canvas.getContext('2d');

    const rekapMusim = {};
    dataPanen.forEach(item => {
        if (!rekapMusim[item.musim]) { rekapMusim[item.musim] = 0; }
        rekapMusim[item.musim] += item.jumlah;
    });

    const labelMusim = Object.keys(rekapMusim);
    const dataBerat = Object.values(rekapMusim);

    if (chartMusimInstance) {
        chartMusimInstance.destroy();
    }

    chartMusimInstance = new Chart(ctx, {
        type: 'bar', 
        data: {
            labels: labelMusim.length > 0 ? labelMusim : ['Belum ada data'],
            datasets: [{
                label: 'Total Produktivitas (Kg)',
                data: dataBerat.length > 0 ? dataBerat : [0],
                backgroundColor: [
                    'rgba(52, 152, 219, 0.7)', 
                    'rgba(46, 204, 113, 0.7)', 
                    'rgba(241, 196, 15, 0.7)', 
                    'rgba(231, 76, 60, 0.7)'   
                ],
                borderColor: [ '#2980b9', '#27ae60', '#f39c12', '#c0392b' ],
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Berat (Kg)' } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// --- KONTROL MODAL ---
function bukaModal(id) { 
    document.getElementById(id).classList.add('show'); 
    renderModalData(); 
    if (id === 'modalLaporan') {
        renderGrafik();
    }
}
function tutupModal(id) { 
    document.getElementById(id).classList.remove('show'); 
}

// --- NOTIFIKASI TOAST ---
function showToast(pesan) {
    const toast = document.getElementById('toast');
    toast.textContent = pesan;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// --- PROSES SUBMIT ---
document.getElementById('formPanen').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const musim = document.getElementById('musimTanam').value;
    const blok = document.getElementById('blokLahan').value;
    const nama = document.getElementById('namaPanen').value;
    const jumlah = parseFloat(document.getElementById('jumlahPanen').value);

    if (!musim || !blok || !nama || isNaN(jumlah) || jumlah <= 0) {
        showToast('Validasi gagal: Lengkapi blok dan komoditas!'); 
        return;
    }

    const opsiWaktu = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    const waktu = new Date().toLocaleDateString('id-ID', opsiWaktu);

    dataPanen.push({ 
        id: Date.now(), 
        musim: musim,
        blok: blok,
        nama: nama, 
        jumlah: jumlah, 
        waktu: waktu 
    });
    localStorage.setItem('dataPanen', JSON.stringify(dataPanen));

    document.getElementById('blokLahan').value = '';
    document.getElementById('namaPanen').value = '';
    document.getElementById('jumlahPanen').value = '';
    
    tutupModal('modalInput');
    showToast('Data disimpan & disinkronkan luring!');
    updateDashboard();
});

window.hapusData = function(id) {
    dataPanen = dataPanen.filter(item => item.id !== id);
    localStorage.setItem('dataPanen', JSON.stringify(dataPanen));
    renderModalData();
    updateDashboard();
    
    // Update grafik jika modal laporan sedang terbuka saat data dihapus (dari riwayat)
    if(document.getElementById('modalLaporan').classList.contains('show')){
         renderGrafik();
    }
    showToast('Data berhasil dihapus dari log.');
}

// Inisialisasi awal
updateDashboard();