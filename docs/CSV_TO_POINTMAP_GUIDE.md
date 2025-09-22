# CSV to Point Map Import Guide

Bu rehber, analızer cihazlarından alınan register CSV dosyalarını EMS point map dosyalarına dönüştürme sürecini açıklar.

## 🎯 Amaç

Power analyzer'lar ve reaktif güç röleleri gibi cihazlar için CSV formatındaki register listeleri EMS YAML point map dosyalarına otomatik olarak dönüştürülür.

## 📁 Desteklenen CSV Formatı

### CSV Header Formatı:
```csv
Register Başlangıç;Register Uznluk;Parametre;Birim;Scale;Veri Tipi;Açıklama (Türkçe);Paket
```

### Örnek CSV Satırları:
```csv
0.0;2.0;VL1n;V;1.0;float;Gerilim VL1n;RG20C
2.0;2.0;VL2n;V;1.0;float;Gerilim VL2n;RG20C
14.0;2.0;IL1;mA;1.0;float;Akım IL1;RG20C
42.0;2.0;∑P;W;1.0;float;∑P;RG20C
64.0;2.0;∑Q;var;1.0;float;∑Q;RG20C
134.0;2.0;PF;;1.0;float;Güç Faktörü;RG20C
```

## ⚙️ CSV Import Tool Kullanımı

### Temel Kullanım:
```bash
cd /Users/gucluceyhan/Desktop/Ankaref/EMS\ Code/EMS
source .venv/bin/activate
python scripts/csv_to_pointmap.py input.csv output.yaml device_name
```

### RG20C Örneği:
```bash
python scripts/csv_to_pointmap.py docs/RG20C_DECIMAL.csv pointmaps/rg20c_reactive_power.yaml "RG20C Reactive Power Relay"
```

### Diğer Analyzer Örnekleri:
```bash
# Schneider PM8000 için
python scripts/csv_to_pointmap.py docs/PM8000_registers.csv pointmaps/schneider_pm8000.yaml "Schneider PM8000"

# Janitza UMG için  
python scripts/csv_to_pointmap.py docs/JANITZA_UMG512.csv pointmaps/janitza_umg512.yaml "Janitza UMG512"

# CIRCUTOR CVM için
python scripts/csv_to_pointmap.py docs/CIRCUTOR_CVM.csv pointmaps/circutor_cvm.yaml "CIRCUTOR CVM"
```

## 🔧 Script Çıktısı

### Oluşturulan Dosyalar:
1. **YAML Point Map** - `pointmaps/device_name.yaml`
2. **JavaScript Profile Entry** - Konsola yazdırılır
3. **Config Example** - Konsola yazdırılır

### Örnek Çıktı:
```
✅ Successfully converted CSV to point map:
   Input:  docs/RG20C_DECIMAL.csv
   Output: pointmaps/rg20c_reactive_power.yaml
   Points: 348 registers

📝 To add this to profiles.js, add this entry to driverProfiles array:
{
  id: 'rg20c-reactive-power',
  name: 'RG20C Reactive Power Relay',
  description: 'Reaktif güç rölesi & power analyzer (RG20C)',
  pointMapFile: 'pointmaps/rg20c_reactive_power.yaml',
  // ... diğer ayarlar
}

🔧 To use in config.yaml:
   point_map: "pointmaps/rg20c_reactive_power.yaml"
```

## 📊 Otomatik Dönüştürmeler

### Birim Dönüştürmeleri:
| **CSV Birim** | **Point Map Birim** | **Scale Adjustment** |
|---------------|---------------------|---------------------|
| `mA` | `A` | × 0.001 |
| `W` | `kW` | × 0.001 |
| `var` | `kVar` | × 0.001 |
| `V` | `V` | × 1.0 |
| `Hz` | `Hz` | × 1.0 |

### Veri Tipi Dönüştürmeleri:
| **CSV Type** | **Point Map Type** |
|--------------|-------------------|
| `float` | `float32` |
| `int` | `int16` |
| `uint` | `uint16` |
| `long` | `int32` |
| `ulong` | `uint32` |
| `bool` | `boolean` |
| `bit` | `bitfield16` |

### Parametre İsmi Temizleme:
- `∑P` → `SUM_P`
- `∑Q` → `SUM_Q` 
- `Δ` → `DELTA_`
- `φ` → `PHI_`
- Özel karakterler → `_`

## 🔗 EMS'e Entegrasyon

### 1. Point Map Dosyasını Config'de Kullanma:
```yaml
devices:
  - id: "analyzer-01"
    type: "power_analyzer"
    make: "RG20C"
    model: "Reactive Power Relay"
    protocol: "modbus_tcp"
    point_map: "pointmaps/rg20c_reactive_power.yaml"
    connection:
      host: "192.168.1.100"
      port: 502
      unit_id: 1
    poll_interval_s: 60
    timeout_ms: 3000
    retries: 3
```

### 2. Profiles.js'e Ekleme:
Script çıktısındaki JavaScript kodu `src/ems/ui/static/assets/js/profiles.js` dosyasının `driverProfiles` array'ine eklenir.

### 3. UI'da Görüntüleme:
- `http://127.0.0.1:8083/ui/settings/profiles` sayfasında görünür
- Seçilebilir ve düzenlenebilir profil olarak kullanılabilir

## 📋 Desteklenen Cihaz Türleri

### Mevcut Point Map Dosyaları:
1. **RG20C Reactive Power Relay** - `pointmaps/rg20c_reactive_power.yaml` (348 register)
2. **SunSpec Inverters** - `pointmaps/sunspec_inverter_common.yaml`
3. **IEC Energy Meters** - `pointmaps/meter_iec62053_generic.yaml`
4. **Weather Stations** - `pointmaps/weather_serial_generic.yaml`
5. **BMS MQTT** - `pointmaps/bms_mqtt_generic.yaml`
6. **Solar Trackers** - `pointmaps/tracker_generic.yaml`

### Yeni Cihaz Ekleme:
1. Cihaz datasheet'inden register CSV'si hazırlayın
2. `csv_to_pointmap.py` script'ini çalıştırın
3. Oluşan YAML dosyasını kontrol edin
4. Profiles.js'e JavaScript entry'sini ekleyin
5. Config.yaml'da test edin

## ⚠️ Önemli Notlar

### CSV Format Gereksinimleri:
- **Delimiter**: `;` (noktalı virgül) tercih edilir
- **Encoding**: UTF-8 veya ISO-8859-1
- **Header**: Tam olarak belirtilen format kullanılmalı
- **Register Address**: Ondalıklı (float) format (örn: `42.0`)

### Manual Düzeltmeler:
- **Control capabilities** alanları manuel ayarlanmalı
- **Poll interval** değerleri cihaza göre optimize edilmeli
- **Min/max value** aralıkları kontrol edilmeli
- **Special register'lar** için custom işlemler gerekebilir

### Debug ve Test:
```bash
# YAML syntax kontrolü
python -c "import yaml; yaml.safe_load(open('pointmaps/rg20c_reactive_power.yaml'))"

# Point sayısı kontrolü
grep -c "address:" pointmaps/rg20c_reactive_power.yaml

# Duplicate address kontrolü
grep "address:" pointmaps/rg20c_reactive_power.yaml | sort | uniq -d
```

## 🚀 Gelecek Geliştirmeler

### UI Entegrasyonu:
- Profiles sayfasında "Import CSV" butonu
- Drag & drop CSV upload
- Preview ve validation
- Otomatik profile creation

### Advanced Features:
- Multi-file CSV import
- Custom register mapping
- Template library
- Export/import profiles

---

**📞 Destek**: Bu tool ile ilgili sorunlar için teknik dokümantasyon veya geliştirici ile iletişime geçin.
