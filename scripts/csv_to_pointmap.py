#!/usr/bin/env python3
"""
CSV to Point Map Generator
Converts device register CSV files to EMS YAML point map files

Usage:
    python csv_to_pointmap.py input.csv output.yaml
    python csv_to_pointmap.py docs/RG20C_DECIMAL.csv pointmaps/rg20c_reactive_power.yaml

CSV Format:
    Register Başlangıç;Register Uznluk;Parametre;Birim;Scale;Veri Tipi;Açıklama (Türkçe);Paket
"""

import csv
import sys
import os
from pathlib import Path
import yaml
from typing import Dict, List, Any, Optional

def clean_parameter_name(param: str) -> str:
    """Clean parameter name to be valid YAML key"""
    # Replace special characters
    param = param.replace('∑', 'SUM_')
    param = param.replace('Δ', 'DELTA_')
    param = param.replace('φ', 'PHI_')
    param = param.replace('θ', 'THETA_')
    param = param.replace('α', 'ALPHA_')
    param = param.replace('β', 'BETA_')
    param = param.replace('γ', 'GAMMA_')
    
    # Remove invalid characters
    param = ''.join(c if c.isalnum() or c in '_-' else '_' for c in param)
    
    # Ensure it starts with a letter
    if param and param[0].isdigit():
        param = 'REG_' + param
        
    return param or 'UNKNOWN'

def convert_data_type(csv_type: str) -> str:
    """Convert CSV data type to Point Map data type"""
    type_mapping = {
        'float': 'float32',
        'int': 'int16',
        'uint': 'uint16',
        'long': 'int32',
        'ulong': 'uint32',
        'bool': 'boolean',
        'bit': 'bitfield16'
    }
    
    csv_type = csv_type.lower().strip()
    return type_mapping.get(csv_type, 'float32')

def convert_unit(csv_unit: str) -> str:
    """Convert CSV unit to standard unit"""
    unit_mapping = {
        'mA': 'A',      # Convert mA to A with scale adjustment
        'kW': 'kW',
        'W': 'kW',      # Convert W to kW with scale adjustment
        'kVar': 'kVar',
        'var': 'kVar',  # Convert var to kVar with scale adjustment
        'V': 'V',
        'A': 'A',
        'Hz': 'Hz',
        '°C': '°C',
        'C': '°C',
        '%': '%',
        '': 'none'
    }
    
    csv_unit = csv_unit.strip()
    return unit_mapping.get(csv_unit, csv_unit or 'none')

def adjust_scale_for_unit_conversion(original_scale: float, csv_unit: str, target_unit: str) -> float:
    """Adjust scale factor when converting units"""
    conversions = {
        ('mA', 'A'): 0.001,
        ('W', 'kW'): 0.001,
        ('var', 'kVar'): 0.001,
    }
    
    conversion_factor = conversions.get((csv_unit.strip(), target_unit), 1.0)
    return original_scale * conversion_factor

def parse_csv_to_pointmap(csv_file: str, device_name: str = None) -> Dict[str, Any]:
    """Parse CSV file and convert to point map structure"""
    
    if device_name is None:
        device_name = Path(csv_file).stem
    
    pointmap = {
        'device_info': {
            'type': 'power_analyzer',
            'protocol': 'modbus_tcp',
            'description': f'{device_name} Power Analyzer/Reactive Power Relay',
            'version': '1.0',
            'author': 'CSV Import Tool',
            'source_file': os.path.basename(csv_file)
        },
        'modbus_settings': {
            'byte_order': 'big_endian',
            'word_order': 'big_endian',
            'unit_id': 1
        },
        'points': {}
    }
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            # Try semicolon delimiter first
            sample = f.read(1024)
            f.seek(0)
            
            delimiter = ';' if sample.count(';') > sample.count(',') else ','
            
            reader = csv.DictReader(f, delimiter=delimiter)
            
            for row_num, row in enumerate(reader, start=2):
                try:
                    # Skip empty rows or rows without register address
                    reg_start = row.get('Register Başlangıç', '').strip()
                    if not reg_start or reg_start == '':
                        continue
                    
                    param = row.get('Parametre', '').strip()
                    if not param or param == '':
                        continue
                        
                    # Parse register information
                    reg_address = int(float(reg_start))
                    reg_length = row.get('Register Uznluk', '2').strip()
                    reg_length = int(float(reg_length)) if reg_length else 2
                    
                    # Parse other fields
                    unit = row.get('Birim', '').strip()
                    scale = row.get('Scale', '1.0').strip()
                    scale = float(scale) if scale else 1.0
                    
                    data_type = row.get('Veri Tipi', 'float').strip()
                    description = row.get('Açıklama (Türkçe)', param).strip()
                    
                    # Convert and clean values
                    param_name = clean_parameter_name(param)
                    target_unit = convert_unit(unit)
                    adjusted_scale = adjust_scale_for_unit_conversion(scale, unit, target_unit)
                    point_data_type = convert_data_type(data_type)
                    
                    # Create point definition
                    point_def = {
                        'address': reg_address,
                        'function_code': 3,  # Holding registers
                        'data_type': point_data_type,
                        'byte_count': reg_length,
                        'scale': adjusted_scale,
                        'offset': 0,
                        'unit': target_unit,
                        'description': description,
                        'read_only': True,
                        'original_parameter': param,
                        'original_unit': unit
                    }
                    
                    # Add range validation for certain parameters
                    if target_unit == 'V':
                        point_def['min_value'] = 0
                        point_def['max_value'] = 1000
                    elif target_unit == 'A':
                        point_def['min_value'] = 0
                        point_def['max_value'] = 10000
                    elif target_unit == 'Hz':
                        point_def['min_value'] = 45.0
                        point_def['max_value'] = 55.0
                    elif target_unit == '%':
                        point_def['min_value'] = 0
                        point_def['max_value'] = 100
                    
                    pointmap['points'][param_name] = point_def
                    
                except (ValueError, KeyError) as e:
                    print(f"Warning: Skipping row {row_num} due to error: {e}")
                    print(f"Row data: {row}")
                    continue
                    
    except UnicodeDecodeError:
        # Try with different encoding
        with open(csv_file, 'r', encoding='iso-8859-1') as f:
            delimiter = ';' if sample.count(';') > sample.count(',') else ','
            reader = csv.DictReader(f, delimiter=delimiter)
            # ... same processing logic
    
    return pointmap

def write_pointmap_yaml(pointmap: Dict[str, Any], output_file: str) -> None:
    """Write point map to YAML file"""
    
    # Custom YAML representer for better formatting
    def float_representer(dumper, value):
        if value == int(value):
            return dumper.represent_int(int(value))
        else:
            return dumper.represent_float(value)
    
    yaml.add_representer(float, float_representer)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        # Write header comment
        f.write(f"# Point Map for {pointmap['device_info']['description']}\n")
        f.write(f"# Generated from: {pointmap['device_info']['source_file']}\n")
        f.write(f"# Generated by: EMS CSV Import Tool\n")
        f.write(f"# Total points: {len(pointmap['points'])}\n\n")
        
        # Write YAML content
        yaml.dump(pointmap, f, default_flow_style=False, allow_unicode=True, 
                 sort_keys=False, indent=2, width=120)

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
        
        # Create output directory if needed
        os.makedirs(os.path.dirname(output_yaml), exist_ok=True)
        
        # Write YAML file
        write_pointmap_yaml(pointmap, output_yaml)
        
        # Generate profiles.js entry
        js_entry = generate_profile_js_entry(device_name, output_yaml, pointmap)
        
        print(f"✅ Successfully converted CSV to point map:")
        print(f"   Input:  {input_csv}")
        print(f"   Output: {output_yaml}")
        print(f"   Points: {len(pointmap['points'])} registers")
        
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
