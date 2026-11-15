<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = "localhost";
$user = "root";
$pass = "";
$db   = "wedding_db";

try {
    $conn = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Gagal koneksi database: " . $e->getMessage()]);
    exit;
}

function uploadBase64($base64String, $fileNamePrefix) {
    
    if (empty($base64String) || $base64String === '-') {
        return $base64String;
    }
    
   
    return $base64String;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'getProduk') {
        $stmt = $conn->query("SELECT * FROM layanan");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
      
        $formattedData = [];
        foreach($data as $row) {
            $formattedData[] = [
                "ID" => $row['id'],
                "Nama Paket WO" => $row['nama_paket'],
                "Kategori" => $row['kategori'],
                "Harga Base" => $row['harga_base'],
                "Kuota Tersedia" => $row['kuota_tersedia'],
                "URL Gambar" => $row['url_gambar'],
                "Deskripsi" => $row['deskripsi'],
                "Varian" => $row['varian']
            ];
        }
        echo json_encode(["status" => "success", "data" => $formattedData]);
        exit;
    }
   
    if ($action === 'getPenjualan') {
        $stmt = $conn->query("SELECT * FROM booking");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $formattedData = [];
        foreach($data as $row) {
            $formattedData[] = [
                "ID Booking" => $row['id_booking'],
                "Tanggal" => $row['tanggal'],
                "Username Klien" => $row['username_klien'],
                "ID Paket" => $row['id_paket'],
                "Nama Paket" => $row['nama_paket'],
                "Jumlah Pax/Item" => $row['jumlah_pax'],
                "Total Harga" => $row['total_harga'],
                "Tipe Pembayaran" => $row['tipe_pembayaran'],
                "Metode Bayar" => $row['metode_bayar'],
                "Detail DP" => $row['detail_dp'],
                "Bukti Pembayaran" => $row['bukti_pembayaran'],
                "Bukti Pelunasan" => $row['bukti_pelunasan'],
                "Status Acara" => $row['status_acara'],
                "Detail Pilihan" => $row['detail_pilihan'],
                "Status Pembayaran" => $row['status_pembayaran'],
                "File Konsep" => $row['file_konsep'],
                "Catatan Klien" => $row['catatan_klien']
            ];
        }
        echo json_encode(["status" => "success", "data" => $formattedData]);
        exit;
    }

   
    if ($action === 'getPengaturan') {
        $stmt = $conn->query("SELECT * FROM pengaturan");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $formattedData = [];
        foreach($data as $row) {
            $formattedData[] = [
                "Key" => $row['setting_key'],
                "Value" => $row['setting_value']
            ];
        }
        echo json_encode(["status" => "success", "data" => $formattedData]);
        exit;
    }

   
    if ($action === 'getDashboard') {
        $stmtProd = $conn->query("SELECT COUNT(*) as total FROM layanan");
        $totProd = $stmtProd->fetchColumn();

        $stmtTrx = $conn->query("SELECT SUM(jumlah_pax) as qty, SUM(total_harga) as rev FROM booking WHERE status_acara != 'Dibatalkan'");
        $rowTrx = $stmtTrx->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success", 
            "data" => [
                "totalProduk" => (int)$totProd, 
                "totalTerjual" => (int)$rowTrx['qty'], 
                "totalPendapatan" => (int)$rowTrx['rev']
            ]
        ]);
        exit;
    }

    
    if ($action === 'getVendor') {
        $stmt = $conn->query("SELECT * FROM vendor");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $formattedData = [];
        foreach($data as $row) {
            $formattedData[] = [
                "ID Vendor" => $row['id_vendor'],
                "Nama Vendor" => $row['nama_vendor'],
                "Kategori" => $row['kategori'],
                "Deskripsi" => $row['deskripsi'],
                "URL Gambar" => $row['url_gambar']
            ];
        }
        echo json_encode(["status" => "success", "data" => $formattedData]);
        exit;
    }

   
    if ($action === 'getBerkas') {
        $stmt = $conn->query("SELECT * FROM berkas");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $formattedData = [];
        foreach($data as $row) {
            $formattedData[] = [
                "ID Booking" => $row['id_booking'],
                "Username" => $row['username'],
                "Nama CPP" => $row['nama_cpp'],
                "Nama CPW" => $row['nama_cpw'],
                "Tgl Akad" => $row['tgl_akad'],
                "Waktu Akad" => $row['waktu_akad'],
                "Tgl Resepsi" => $row['tgl_resepsi'],
                "Waktu Resepsi" => $row['waktu_resepsi'],
                "Jumlah Undangan" => $row['undangan'],
                "Konsep Pernikahan" => $row['konsep'],
                "Konsep Make Up" => $row['makeup'],
                "Busana Pengantin" => $row['busana'],
                "Pesanan Paket" => $row['pesanan'],
                "Tgl & Lokasi Prewedding" => $row['prewed'],
                "Tgl & Lokasi TM" => $row['tm'],
                "Vendor Dekorasi" => $row['v_dekorasi'],
                "Vendor MUA" => $row['v_mua'],
                "Vendor Perias Keluarga" => $row['v_keluarga'],
                "Vendor MC" => $row['v_mc'],
                "Vendor Entertainment" => $row['v_ent'],
                "Vendor Catering" => $row['v_catering'],
                "Vendor Dokumentasi" => $row['v_dok'],
                "Vendor Sound System" => $row['v_sound'],
                "Vendor Attire" => $row['v_attire'],
                "Vendor Venue" => $row['v_venue'],
                "Catatan Tambahan" => $row['catatan'],
                "File Buku Panduan" => $row['file_panduan'],
                "Data Upgrade" => $row['data_upgrade'],
                "HTML Panduan" => $row['html_panduan']
            ];
        }
        echo json_encode(["status" => "success", "data" => $formattedData]);
        exit;
    }
    
   
}






if ($_SERVER['REQUEST_METHOD'] === 'POST') {
   
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    $action = $data['action'] ?? '';

   
    if ($action === 'login') {
        $username = $data['username'];
        $password = $data['password'];

        $stmt = $conn->prepare("SELECT * FROM klien WHERE username = ? AND password = ?");
        $stmt->execute([$username, $password]); 
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            echo json_encode([
                "status" => "success",
                "data" => [
                    "username" => $user['username'],
                    "nama_lengkap" => $user['nama_lengkap'],
                    "no_hp" => $user['no_hp'],
                    "foto_profil" => $user['foto_profil']
                ]
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Username atau Password salah!"]);
        }
        exit;
    }

    
    if ($action === 'addPenjualan') {
        $idTransaksi = "WDG-" . time();
        $tanggal = date('Y-m-d H:i:s');
        
        
       $buktiUrl = "-";
        if (isset($data['bukti_pembayaran']) && strpos($data['bukti_pembayaran'], 'data:') === 0) {
            $buktiUrl = uploadBase64($data['bukti_pembayaran'], "Bukti_" . $idTransaksi);
        }

        $stmt = $conn->prepare("INSERT INTO booking (id_booking, tanggal, username_klien, id_paket, nama_paket, jumlah_pax, total_harga, tipe_pembayaran, metode_bayar, detail_dp, bukti_pembayaran, status_acara, detail_pilihan, status_pembayaran) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        try {
            $stmt->execute([
                $idTransaksi, $tanggal, $data['username'], $data['id_paket'], 
                $data['nama_paket'], $data['jumlah'], $data['total_harga'], 
                $data['tipe_pembayaran'], $data['metode_bayar'], $data['detail_dp'], 
                $buktiUrl, "Estimasi Biaya", $data['varian_array'], "Belum Bayar"
            ]);
            echo json_encode(["status" => "success", "message" => "Booking berhasil dibuat!", "id_transaksi" => $idTransaksi]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }
    

   
    if ($action === 'register') {
        
        $check = $conn->prepare("SELECT username FROM klien WHERE username = ?");
        $check->execute([$data['username']]);
        if ($check->rowCount() > 0) {
            echo json_encode(["status" => "error", "message" => "Username sudah terdaftar!"]);
            exit;
        }

        $fotoUrl = "";
            if (isset($data['foto']) && strpos($data['foto'], 'data:') === 0) {
                $fotoUrl = uploadBase64ToLocal($data['foto'], "Profil_" . $data['username']);
            }


        $stmt = $conn->prepare("INSERT INTO klien (username, nama_lengkap, no_hp, password, foto_profil) VALUES (?, ?, ?, ?, ?)");
        try {
            $stmt->execute([$data['username'], $data['nama_lengkap'], $data['no_hp'], $data['password'], $fotoUrl]);
            echo json_encode(["status" => "success", "message" => "Pendaftaran berhasil"]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }

    
    if ($action === 'savePengaturan') {
        
        $settings = [
            'logo_light' => $data['logo_light'] ?? null,
            'logo_dark' => $data['logo_dark'] ?? null,
            'login_bg' => $data['login_bg'] ?? null,
            'banner_1' => $data['banner_1'] ?? null,
            'banner_2' => $data['banner_2'] ?? null,
            'banner_3' => $data['banner_3'] ?? null,
            'qris_lunas' => $data['qris_lunas'] ?? null,
            'qris_dp' => $data['qris_dp'] ?? null,
            'admin_wa' => $data['admin_wa'] ?? null,
            'qris_name' => $data['qris_name'] ?? null,
            'link_buku_panduan' => $data['link_buku_panduan'] ?? null
        ];

        try {
            foreach ($settings as $key => $val) {
               
                if ($val !== null) {
                    
                    if ($val === "DELETE") {
                        $finalVal = ""; 
                    } elseif (strpos($val, "data:image") === 0) {
                       
                        $ext = strpos($val, "image/png") !== false ? ".png" : ".jpg";
                        $finalVal = uploadBase64($val, "Setting_" . $key . "_" . time() . $ext);
                    } else {
                       
                        $finalVal = $val;
                    }

                   
                    $stmt = $conn->prepare("INSERT INTO pengaturan (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
                    $stmt->execute([$key, $finalVal, $finalVal]);
                }
            }
            echo json_encode(["status" => "success", "message" => "Pengaturan diperbarui"]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }

  
    if ($action === 'addProduk' || $action === 'editProduk') {
        $arrGbrUrls = [];
        if (!empty($data['gambar'])) {
            $arrGbr = explode('|', $data['gambar']);
            foreach ($arrGbr as $i => $g) {
                if (strpos($g, 'data:') === 0) {
                    $arrGbrUrls[] = uploadBase64($g, "Layanan_" . $data['id'] . "_" . $i . ".jpg");
                } else if (strpos($g, 'http') === 0) {
                    $arrGbrUrls[] = $g; 
                }
            }
        }
        $gambarUrl = implode(',', $arrGbrUrls);
        $varianStr = is_array($data['varian']) ? json_encode($data['varian']) : $data['varian'];

        if ($action === 'addProduk') {
            $stmt = $conn->prepare("INSERT INTO layanan (id, nama_paket, kategori, harga_base, kuota_tersedia, url_gambar, deskripsi, varian) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$data['id'], $data['nama'], $data['kategori'], $data['harga'], $data['stok'], $gambarUrl, $data['deskripsi'], $varianStr]);
        } else {
            $stmt = $conn->prepare("UPDATE layanan SET nama_paket=?, kategori=?, harga_base=?, kuota_tersedia=?, url_gambar=?, deskripsi=?, varian=? WHERE id=?");
            $stmt->execute([$data['nama'], $data['kategori'], $data['harga'], $data['stok'], $gambarUrl, $data['deskripsi'], $varianStr, $data['id']]);
        }
        echo json_encode(["status" => "success", "message" => "Data Layanan berhasil disimpan!"]);
        exit;
    }

   
    if ($action === 'deleteProduk') {
        $stmt = $conn->prepare("DELETE FROM layanan WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(["status" => "success", "message" => "Paket Layanan dihapus!"]);
        exit;
    }

   
    if ($action === 'addVendor' || $action === 'editVendor') {
        $arrGbrUrls = [];
        if (!empty($data['gambar'])) {
            $arrGbr = explode('|', $data['gambar']);
            foreach ($arrGbr as $i => $g) {
                if (strpos($g, 'data:') === 0) {
                    $arrGbrUrls[] = uploadBase64($g, "Vendor_" . $data['id'] . "_" . $i . ".jpg");
                } else if (strpos($g, 'http') === 0) {
                    $arrGbrUrls[] = $g;
                }
            }
        }
        $gambarUrl = implode(',', $arrGbrUrls);

        if ($action === 'addVendor') {
            $stmt = $conn->prepare("INSERT INTO vendor (id_vendor, nama_vendor, kategori, deskripsi, url_gambar) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$data['id'], $data['nama'], $data['kategori'], $data['deskripsi'], $gambarUrl]);
        } else {
            $stmt = $conn->prepare("UPDATE vendor SET nama_vendor=?, kategori=?, deskripsi=?, url_gambar=? WHERE id_vendor=?");
            $stmt->execute([$data['nama'], $data['kategori'], $data['deskripsi'], $gambarUrl, $data['id']]);
        }
        echo json_encode(["status" => "success", "message" => "Data Vendor berhasil disimpan!"]);
        exit;
    }

  
    if ($action === 'deleteVendor') {
        $stmt = $conn->prepare("DELETE FROM vendor WHERE id_vendor = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(["status" => "success", "message" => "Vendor dihapus!"]);
        exit;
    }

   
    if ($action === 'updateStatus') {
        $id = $data['id_transaksi'];
        if (isset($data['status_pembayaran'])) {
            $stmt = $conn->prepare("UPDATE booking SET status_pembayaran = ? WHERE id_booking = ?");
            $stmt->execute([$data['status_pembayaran'], $id]);
        }
        if (isset($data['status_pesanan'])) {
            $stmt = $conn->prepare("UPDATE booking SET status_acara = ? WHERE id_booking = ?");
            $stmt->execute([$data['status_pesanan'], $id]);
        }
        echo json_encode(["status" => "success", "message" => "Status diperbarui"]);
        exit;
    }

    
    if ($action === 'updateCustomHarga') {
        $stmt = $conn->prepare("UPDATE booking SET total_harga = ?, tipe_pembayaran = ?, metode_bayar = ?, detail_dp = ?, status_acara = 'Menunggu Pembayaran' WHERE id_booking = ?");
        $stmt->execute([
            $data['total_harga'], $data['tipe_pembayaran'], $data['metode_bayar'], 
            $data['detail_dp'], $data['id_transaksi']
        ]);
        echo json_encode(["status" => "success", "message" => "Harga Penawaran Disimpan"]);
        exit;
    }

    
    if ($action === 'deleteBooking') {
        $stmt = $conn->prepare("DELETE FROM booking WHERE id_booking = ?");
        $stmt->execute([$data['id_transaksi']]);
        
        
        $stmtLog = $conn->prepare("INSERT INTO aktivitas (waktu, teks) VALUES (?, ?)");
        $stmtLog->execute([date('Y-m-d H:i:s'), "Menghapus permanen data booking ID: " . $data['id_transaksi']]);
        
        echo json_encode(["status" => "success", "message" => "Data Booking berhasil dihapus!"]);
        exit;
    }

    
    if ($action === 'bayarTagihan') {
       $buktiUrl = "";
if (isset($data['bukti']) && strpos($data['bukti'], 'data:') === 0) {
    $buktiUrl = uploadBase64($data['bukti'], "Bayar_" . $data['id_transaksi']);
}
        $statusBayar = $data['is_dp'] ? "Sudah DP" : "Lunas";

        $stmt = $conn->prepare("UPDATE booking SET bukti_pembayaran = ?, status_acara = 'Menunggu Konfirmasi', status_pembayaran = ? WHERE id_booking = ?");
        $stmt->execute([$buktiUrl, $statusBayar, $data['id_transaksi']]);
        
        echo json_encode(["status" => "success", "message" => "Bukti pembayaran terkirim!"]);
        exit;
    }

   
    if ($action === 'updateBuktiPelunasan') {
       $pelunasanUrl = "";
if (isset($data['bukti_pelunasan']) && strpos($data['bukti_pelunasan'], 'data:') === 0) {
    $pelunasanUrl = uploadBase64($data['bukti_pelunasan'], "Pelunasan_" . $data['id_transaksi']);
}

        $stmt = $conn->prepare("UPDATE booking SET bukti_pelunasan = ? WHERE id_booking = ?");
        $stmt->execute([$pelunasanUrl, $data['id_transaksi']]);
        
        echo json_encode(["status" => "success", "message" => "Bukti pelunasan berhasil diunggah!"]);
        exit;
    }

   
    if ($action === 'saveBerkas') {
       
        $fileUrl = $data['file_panduan_lama'] ?? "";
        if (!empty($data['file_panduan']) && strpos($data['file_panduan'], 'data:') === 0) {
            $ext = strpos($data['file_panduan'], 'pdf') !== false ? '.pdf' : '.docx';
            $fileUrl = uploadBase64($data['file_panduan'], "BukuPanduan_" . $data['id_booking'] . $ext);
        }

        
        $stmt = $conn->prepare("INSERT INTO berkas (id_booking, username, nama_cpp, nama_cpw, tgl_akad, waktu_akad, tgl_resepsi, waktu_resepsi, undangan, konsep, makeup, busana, pesanan, prewed, tm, v_dekorasi, v_mua, v_keluarga, v_mc, v_ent, v_catering, v_dok, v_sound, v_attire, v_venue, catatan, file_panduan, data_upgrade) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            username=VALUES(username), nama_cpp=VALUES(nama_cpp), nama_cpw=VALUES(nama_cpw), tgl_akad=VALUES(tgl_akad), waktu_akad=VALUES(waktu_akad), tgl_resepsi=VALUES(tgl_resepsi), waktu_resepsi=VALUES(waktu_resepsi), undangan=VALUES(undangan), konsep=VALUES(konsep), makeup=VALUES(makeup), busana=VALUES(busana), pesanan=VALUES(pesanan), prewed=VALUES(prewed), tm=VALUES(tm), v_dekorasi=VALUES(v_dekorasi), v_mua=VALUES(v_mua), v_keluarga=VALUES(v_keluarga), v_mc=VALUES(v_mc), v_ent=VALUES(v_ent), v_catering=VALUES(v_catering), v_dok=VALUES(v_dok), v_sound=VALUES(v_sound), v_attire=VALUES(v_attire), v_venue=VALUES(v_venue), catatan=VALUES(catatan), file_panduan=VALUES(file_panduan), data_upgrade=VALUES(data_upgrade)");

        try {
            $stmt->execute([
                $data['id_booking'], $data['username'], $data['cpp'], $data['cpw'], $data['tgl_akad'], $data['waktu_akad'],
                $data['tgl_resepsi'], $data['waktu_resepsi'], $data['undangan'], $data['konsep'], $data['makeup'],
                $data['busana'], $data['pesanan'], $data['prewed'], $data['tm'], $data['v_dekorasi'], $data['v_mua'],
                $data['v_keluarga'], $data['v_mc'], $data['v_ent'], $data['v_catering'], $data['v_dok'], $data['v_sound'],
                $data['v_attire'], $data['v_venue'], $data['catatan'], $fileUrl, $data['data_upgrade']
            ]);
            echo json_encode(["status" => "success", "message" => "Data Berkas & Tagihan berhasil disimpan!"]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }

   
    if ($action === 'savePanduanHTML') {
       
        $stmt = $conn->prepare("INSERT INTO berkas (id_booking, html_panduan) VALUES (?, ?) ON DUPLICATE KEY UPDATE html_panduan = VALUES(html_panduan)");
        $stmt->execute([$data['id_booking'], $data['html_panduan']]);
        
        echo json_encode(["status" => "success", "message" => "Buku Panduan HTML berhasil disimpan permanen!"]);
        exit;
    }

  
    if ($action === 'saveJadwal') {
        $stmt = $conn->prepare("INSERT INTO jadwal (id_booking, pj, tgl_tm, waktu_tm, lokasi_tm, status_tm, mc, vocal, keyboard, saxo, wo, keterangan) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            pj=VALUES(pj), tgl_tm=VALUES(tgl_tm), waktu_tm=VALUES(waktu_tm), lokasi_tm=VALUES(lokasi_tm), status_tm=VALUES(status_tm), mc=VALUES(mc), vocal=VALUES(vocal), keyboard=VALUES(keyboard), saxo=VALUES(saxo), wo=VALUES(wo), keterangan=VALUES(keterangan)");

        try {
            $stmt->execute([
                $data['id_booking'], $data['pj'], $data['tgl_tm'], $data['waktu_tm'], $data['lokasi_tm'], $data['status_tm'],
                $data['mc'], $data['vocal'], $data['keyboard'], $data['sexo'], $data['wo'], $data['keterangan']
            ]);
            echo json_encode(["status" => "success", "message" => "Penugasan Jadwal berhasil disimpan!"]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }
}
?>