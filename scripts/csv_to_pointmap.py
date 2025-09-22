#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSV to Point Map Generator (FULL)
- Tüm geçerli satırları *atlamadan* point'e çevirir.
- Delimiter ve encoding sniff eder.
- Boş/eksik alanlara dayanıklı.
- Register uzunluğunu doğru şekilde "register_count" olarak yazar.
- Duplicated key'lerde otomatik unique isim üretir.
- Unit dönüşümünü scale ile birlikte yapar (mA->A, W->kW, var->kVar).
- Hata veren satırları _meta bölümünde raporlar (ilk 10 örnek dahil).

Kullanım:
    python csv_to_pointmap.py input.csv output.yaml [device_name]
"""

from __future__ import annotations
import os
from pathlib import Path
from typing import Dict, Any, Tuple
import yaml
import math
import pandas as pd

def sniff_delimiter_and_encoding(path: str) -> Tuple[str, str]:
    encodings = ["utf-8", "iso-8859-9", "windows-1254", "latin-1"]
    for enc in encodings:
        try:
            with open(path, "r", encoding=enc) as f:
                sample = f.read(4096)
            delimiter = ";" if sample.count(";") >= sample.count(",") else ","
            return delimiter, enc
        except UnicodeDecodeError:
            continue
    return ";", "latin-1"

def clean_parameter_name(param: str) -> str:
    subs = {"∑": "SUM_", "Δ": "DELTA_", "φ": "PHI_", "θ": "THETA_", "α": "ALPHA_", "β": "BETA_", "γ": "GAMMA_",
            "ı":"i","İ":"I","ğ":"g","Ğ":"G","ş":"s","Ş":"S","ö":"o","Ö":"O","ü":"u","Ü":"U"}
    for k, v in subs.items():
        param = param.replace(k, v)
    out = []
    for c in param:
        if c.isalnum() or c in "_-:.":
            out.append(c)
        else:
            out.append("_")
    key = "".join(out).strip("_")
    if key and key[0].isdigit():
        key = "REG_" + key
    return key or "UNKNOWN"

def safe_float(v: Any, default: float = 0.0) -> float:
    try:
        s = str(v).strip().replace(",", ".")
        if s == "" or s.lower() == "nan":
            return default
        return float(s)
    except Exception:
        return default

def safe_int(v: Any, default: int | None = 0) -> int | None:
    try:
        s = str(v).strip().replace(",", ".")
        if s == "" or s.lower() == "nan":
            return default
        return int(float(s))
    except Exception:
        return default

def convert_data_type(csv_type: str):
    t = (csv_type or "").lower().strip()
    if "bool" in t:
        return ("boolean", 1)
    if t in ("bit", "bitfield", "bitfield16"):
        return ("bitfield16", 1)
    if "uint32" in t or ("ulong" in t) or ("dword" in t) or ("u32" in t):
        return ("uint32", 2)
    if "int32" in t or ("long" in t) or ("i32" in t):
        return ("int32", 2)
    if "uint16" in t or ("ushort" in t) or ("u16" in t) or ("word" in t) or ("uint" in t):
        return ("uint16", 1)
    if "int16" in t or ("short" in t) or ("i16" in t) or ("int" in t):
        return ("int16", 1)
    if "float64" in t or "double" in t:
        return ("float64", 4)
    if "float" in t or "real" in t:
        return ("float32", 2)
    return ("float32", 2)

def convert_unit_and_scale(csv_unit: str, scale: float):
    unit_map = {
        "ma": ("A", 0.001),
        "w": ("kW", 0.001),
        "var": ("kVar", 0.001),
        "°c": ("°C", 1.0),
        "c": ("°C", 1.0),
        "": ("none", 1.0),
    }
    u = (csv_unit or "").strip()
    key = u.lower()
    if key in unit_map:
        target, factor = unit_map[key]
        return target, scale * factor
    if u in ("kW", "kVar", "kVA", "V", "A", "Hz", "%", "kWh", "VA"):
        return u, scale
    return (u or "none", scale)

def ensure_unique_key(base: str, existing: Dict[str, Any], suffix: str = "") -> str:
    key = base if not suffix else f"{base}_{suffix}"
    if key not in existing:
        return key
    i = 2
    while True:
        candidate = f"{key}_{i}"
        if candidate not in existing:
            return candidate
        i += 1

def build_point(row: Dict[str, Any], points: Dict[str, Any]):
    reg_start = row.get("Register Başlangıç", "")
    reg_len = row.get("Register Uznluk", "")
    param = row.get("Parametre", "") or ""
    unit = row.get("Birim", "")
    scale = row.get("Scale", "")
    csv_type = row.get("Veri Tipi", "")
    desc = row.get("Açıklama (Türkçe)", "") or param
    paket = row.get("Paket", "")

    if str(reg_start).strip() == "":
        raise ValueError("Boş 'Register Başlangıç'")
    address = safe_int(reg_start, None)
    if address is None:
        raise ValueError(f"Geçersiz address: {reg_start}")

    dtype, default_regs = convert_data_type(str(csv_type))
    rlen = safe_int(reg_len, default_regs)
    if rlen is None or rlen <= 0:
        rlen = default_regs

    sc = safe_float(scale, 1.0)
    tgt_unit, sc2 = convert_unit_and_scale(unit, sc)

    base_key = clean_parameter_name(param) or f"REG_{address}"
    key = ensure_unique_key(base_key, points)

    point = {
        "address": address,
        "function_code": 3,
        "register_count": rlen,
        "data_type": dtype,
        "scale": sc2,
        "offset": 0,
        "unit": tgt_unit,
        "description": str(desc).strip(),
        "read_only": True,
        "csv_original": {
            "parameter": param,
            "unit": unit,
            "scale": scale,
            "type": csv_type,
            "register_length": reg_len,
            "paket": paket,
        },
    }

    u = point["unit"]
    if u == "V":
        point.update({"min_value": 0, "max_value": 1000})
    elif u == "A":
        point.update({"min_value": 0, "max_value": 10000})
    elif u == "Hz":
        point.update({"min_value": 45.0, "max_value": 65.0})
    elif u == "%":
        point.update({"min_value": 0, "max_value": 100})

    return key, point

def load_dataframe(csv_path: str) -> pd.DataFrame:
    delim, enc = sniff_delimiter_and_encoding(csv_path)
    try:
        df = pd.read_csv(csv_path, sep=delim, encoding=enc, dtype=str, keep_default_na=False)
    except Exception:
        for enc2 in ("utf-8", "iso-8859-9", "windows-1254", "latin-1"):
            try:
                df = pd.read_csv(csv_path, sep=";", encoding=enc2, dtype=str, keep_default_na=False)
                break
            except Exception:
                continue
        else:
            raise
    df.columns = [c.strip() for c in df.columns]
    df = df.map(lambda x: x.strip() if isinstance(x, str) else x)
    return df

def parse_csv_to_pointmap(csv_path: str, device_name: str | None = None) -> Dict[str, Any]:
    if device_name is None:
        device_name = Path(csv_path).stem

    df = load_dataframe(csv_path)
    expected = ["Register Başlangıç", "Register Uznluk", "Parametre", "Birim", "Scale", "Veri Tipi", "Açıklama (Türkçe)", "Paket"]
    for col in expected:
        if col not in df.columns:
            df[col] = ""

    pointmap: Dict[str, Any] = {
        "device_info": {
            "type": "power_analyzer",
            "protocol": "modbus_tcp",
            "description": f"{device_name} Power Analyzer/Reactive Power Relay",
            "version": "1.0",
            "author": "CSV Import Tool (full)",
            "source_file": os.path.basename(csv_path),
        },
        "modbus_settings": {
            "byte_order": "big_endian",
            "word_order": "big_endian",
            "unit_id": 1,
        },
        "points": {},
    }

    total = 0
    errors = 0
    err_rows = []

    for idx, row in df.iterrows():
        total += 1
        try:
            key, point = build_point(row.to_dict(), pointmap["points"])
            pointmap["points"][key] = point
        except Exception as e:
            errors += 1
            err_rows.append({"row_index": int(idx), "error": str(e), "row": row.to_dict()})

    pointmap["_meta"] = {
        "total_rows": total,
        "converted_points": len(pointmap["points"]),
        "errors": errors,
    }
    if err_rows:
        pointmap["_meta"]["error_samples"] = err_rows[:10]
    return pointmap

def float_representer(dumper, value):
    if math.isfinite(value) and float(int(value)) == float(value):
        return dumper.represent_int(int(value))
    return dumper.represent_float(value)

yaml.add_representer(float, float_representer)

def write_pointmap_yaml(pointmap: Dict[str, Any], output_file: str) -> None:
    os.makedirs(os.path.dirname(output_file) or ".", exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(f"# Point Map for {pointmap['device_info']['description']}\n")
        f.write(f"# Generated from: {pointmap['device_info']['source_file']}\n")
        f.write(f"# Generated by: CSV Import Tool (full)\n")
        f.write(f"# Total points: {len(pointmap['points'])}\n\n")
        yaml.dump(pointmap, f, default_flow_style=False, allow_unicode=True, sort_keys=False, indent=2, width=120)

def generate_profile_js_entry(device_name: str, pointmap_file: str, pointmap: Dict[str, Any]) -> str:
    """Generate JavaScript profile entry for profiles.js"""
    
    # Categorize points for better preview
    voltage_points = []
    current_points = []
    power_points = []
    energy_points = []
    frequency_points = []
    other_points = []
    
    for name, point in pointmap['points'].items():
        desc = point.get('description', '').lower()
        unit = point.get('unit', '')
        address = point['address']
        data_type = point['data_type']
        scale = point['scale']
        
        point_str = f"'{name}: fc=3, address={address}, type={data_type}, scale={scale}, unit={unit}'"
        
        if unit == 'V' or 'gerilim' in desc or 'voltage' in desc:
            voltage_points.append(point_str)
        elif unit == 'A' or 'akım' in desc or 'current' in desc:
            current_points.append(point_str)
        elif unit in ['kW', 'kVar', 'kVA', 'W', 'var', 'VA'] or 'güç' in desc or 'power' in desc:
            power_points.append(point_str)
        elif unit == 'kWh' or 'enerji' in desc or 'energy' in desc:
            energy_points.append(point_str)
        elif unit == 'Hz' or 'frekans' in desc or 'frequency' in desc:
            frequency_points.append(point_str)
        else:
            other_points.append(point_str)
    
    # Build comprehensive preview
    preview_lines = []
    total_points = len(pointmap['points'])
    
    if voltage_points:
        preview_lines.append(f"'# VOLTAGE MEASUREMENTS ({len(voltage_points)} registers)'")
        preview_lines.extend(voltage_points[:6])  # First 6 voltage points
        if len(voltage_points) > 6:
            preview_lines.append("''")
    
    if current_points:
        preview_lines.append(f"'# CURRENT MEASUREMENTS ({len(current_points)} registers)'")
        preview_lines.extend(current_points[:4])  # First 4 current points
        if len(current_points) > 4:
            preview_lines.append("''")
    
    if power_points:
        preview_lines.append(f"'# POWER MEASUREMENTS ({len(power_points)} registers)'")
        preview_lines.extend(power_points[:6])  # First 6 power points
        if len(power_points) > 6:
            preview_lines.append("''")
    
    if energy_points:
        preview_lines.append(f"'# ENERGY MEASUREMENTS ({len(energy_points)} registers)'")
        preview_lines.extend(energy_points[:3])  # First 3 energy points
        preview_lines.append("''")
    
    if frequency_points:
        preview_lines.append(f"'# FREQUENCY MEASUREMENTS ({len(frequency_points)} registers)'")
        preview_lines.extend(frequency_points[:2])  # First 2 frequency points
        preview_lines.append("''")
    
    if other_points:
        preview_lines.append(f"'# OTHER MEASUREMENTS ({len(other_points)} registers)'")
        preview_lines.extend(other_points[:4])  # First 4 other points
        preview_lines.append("''")
    
    # Add summary
    preview_lines.append(f"'# TOTAL: {total_points} REGISTERS'")
    preview_lines.append(f"'# Categories: V:{len(voltage_points)}, A:{len(current_points)}, P:{len(power_points)}, E:{len(energy_points)}, Hz:{len(frequency_points)}, Other:{len(other_points)}'")
    
    # Determine control capabilities based on device type and available points
    reactive_power_control = len([p for p in power_points if 'var' in p.lower() or 'reactive' in p.lower()]) > 0
    frequency_control = len(frequency_points) > 0
    
    js_entry = f"""
  {{
    id: '{device_name.lower().replace(' ', '-')}',
    name: '{device_name}',
    description: '{pointmap['device_info']['description']}',
    pointMapFile: '{pointmap_file}',
    pollInterval: 60,
    timeout: 3000,
    retries: 3,
    protocol: 'modbus_tcp',
    controlCapabilities: {{
      set_active_power_limit: {str(len(power_points) > 0).lower()},
      open_breaker: false,
      close_breaker: false,
      emergency_stop: false,
      reactive_power_control: {str(reactive_power_control).lower()},
      frequency_control: {str(frequency_control).lower()}
    }},
    pointMapPreview: [
      {',\\n      '.join(preview_lines)}
    ]
  }}"""
    
    return js_entry

def main():
    import sys
    if len(sys.argv) < 2:
        print("Usage: python csv_to_pointmap.py input.csv [output.yaml] [device_name]")
        print("Example: python csv_to_pointmap.py docs/RG20C_DECIMAL.csv pointmaps/rg20c.yaml RG20C")
        sys.exit(1)
    
    input_csv = sys.argv[1]
    if not os.path.exists(input_csv):
        print(f"Error: Input file '{input_csv}' not found")
        sys.exit(1)
    
    # Default output file
    if len(sys.argv) >= 3:
        output_yaml = sys.argv[2]
    else:
        base_name = Path(input_csv).stem.lower()
        output_yaml = f"pointmaps/{base_name}.yaml"
    
    # Device name
    if len(sys.argv) >= 4:
        device_name = sys.argv[3]
    else:
        device_name = Path(input_csv).stem.upper()
    
    print(f"Converting {input_csv} to {output_yaml}...")
    
    try:
        # Parse CSV to point map
        pointmap = parse_csv_to_pointmap(input_csv, device_name)
        
        # Write YAML file
        write_pointmap_yaml(pointmap, output_yaml)
        
        # Generate profiles.js entry
        js_entry = generate_profile_js_entry(device_name, output_yaml, pointmap)
        
        print(f"✅ Successfully converted CSV to point map:")
        print(f"   Input:  {input_csv}")
        print(f"   Output: {output_yaml}")
        print(f"   Points: {len(pointmap['points'])} registers")
        
        if pointmap.get('_meta', {}).get('errors', 0) > 0:
            print(f"⚠️  Warnings: {pointmap['_meta']['errors']} rows skipped due to missing/invalid data")
            print(f"   Total rows processed: {pointmap['_meta']['total_rows']}")
            print(f"   Successfully converted: {pointmap['_meta']['converted_points']}")
        
        print(f"\\n📝 To add this to profiles.js, add this entry to driverProfiles array:")
        print(f"{js_entry}")
        
        print(f"\\n🔧 To use in config.yaml:")
        print(f"   point_map: \"{output_yaml}\"")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
