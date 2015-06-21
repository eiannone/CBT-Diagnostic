var PIDUtils = {
    standardPids: [
        "PIDs supported [01 - 20]",
        "Monitor status since DTCs cleared. (Includes malfunction indicator lamp (MIL) status and number of DTCs.)",
        "Freeze DTC",
        "Fuel system status",
        "Calculated engine load value",
        "Engine coolant temperature",
        "Short term fuel % trim—Bank 1",
        "Long term fuel % trim—Bank 1",
        "Short term fuel % trim—Bank 2",
        "Long term fuel % trim—Bank 2",
        "Fuel pressure",
        "Intake manifold absolute pressure",
        "Engine RPM",
        "Vehicle speed",
        "Timing advance",
        "Intake air temperature",
        "MAF air flow rate",
        "Throttle position",
        "Commanded secondary air status",
        "Oxygen sensors present",
        "Bank 1, Sensor 1: Oxygen sensor voltage, Short term fuel trim",
        "Bank 1, Sensor 2: Oxygen sensor voltage, Short term fuel trim",
        "Bank 1, Sensor 3: Oxygen sensor voltage, Short term fuel trim",
        "Bank 1, Sensor 4: Oxygen sensor voltage, Short term fuel trim",
        "Bank 2, Sensor 1: Oxygen sensor voltage, Short term fuel trim",
        "Bank 2, Sensor 2: Oxygen sensor voltage, Short term fuel trim",
        "Bank 2, Sensor 3: Oxygen sensor voltage, Short term fuel trim",
        "Bank 2, Sensor 4: Oxygen sensor voltage, Short term fuel trim",
        "OBD standards this vehicle conforms to",
        "Oxygen sensors present",
        "Auxiliary input status",
        "Run time since engine start",
        "PIDs supported [21 - 40]",
        "Distance traveled with malfunction indicator lamp (MIL) on",
        "Fuel Rail Pressure (relative to manifold vacuum)",
        "Fuel Rail Pressure (diesel, or gasoline direct inject)",
        "O2S1_WR_lambda(1): Equivalence Ratio Voltage",
        "O2S2_WR_lambda(1): Equivalence Ratio Voltage",
        "O2S3_WR_lambda(1): Equivalence Ratio Voltage",
        "O2S4_WR_lambda(1): Equivalence Ratio Voltage",
        "O2S5_WR_lambda(1): Equivalence Ratio Voltage",
        "O2S6_WR_lambda(1): Equivalence Ratio Voltage",
        "O2S7_WR_lambda(1): Equivalence Ratio Voltage",
        "O2S8_WR_lambda(1): Equivalence Ratio Voltage",
        "Commanded EGR",
        "EGR Error",
        "Commanded evaporative purge",
        "Fuel Level Input",
        "# of warm-ups since codes cleared",
        "Distance traveled since codes cleared",
        "Evap. System Vapor Pressure",
        "Barometric pressure",
        "O2S1_WR_lambda(1): Equivalence Ratio Current",
        "O2S2_WR_lambda(1): Equivalence Ratio Current",
        "O2S3_WR_lambda(1): Equivalence Ratio Current",
        "O2S4_WR_lambda(1): Equivalence Ratio Current",
        "O2S5_WR_lambda(1): Equivalence Ratio Current",
        "O2S6_WR_lambda(1): Equivalence Ratio Current",
        "O2S7_WR_lambda(1): Equivalence Ratio Current",
        "O2S8_WR_lambda(1): Equivalence Ratio Current",
        "Catalyst Temperature Bank 1, Sensor 1",
        "Catalyst Temperature Bank 2, Sensor 1",
        "Catalyst Temperature Bank 1, Sensor 2",
        "Catalyst Temperature Bank 2, Sensor 2",
        "PIDs supported [41 - 60]",
        "Monitor status this drive cycle",
        "Control module voltage",
        "Absolute load value",
        "Fuel/Air commanded equivalence ratio",
        "Relative throttle position",
        "Ambient air temperature",
        "Absolute throttle position B",
        "Absolute throttle position C",
        "Accelerator pedal position D",
        "Accelerator pedal position E",
        "Accelerator pedal position F",
        "Commanded throttle actuator",
        "Time run with MIL on",
        "Time since trouble codes cleared",
        "Maximum value for equivalence ratio, oxygen sensor voltage, oxygen sensor current, and intake manifold absolute pressure",
        "Maximum value for air flow rate from mass air flow sensor",
        "Fuel Type",
        "Ethanol fuel %",
        "Absolute Evap system Vapor Pressure",
        "Evap system vapor pressure",
        "Short term secondary oxygen sensor trim bank 1 and bank 3",
        "Long term secondary oxygen sensor trim bank 1 and bank 3",
        "Short term secondary oxygen sensor trim bank 2 and bank 4",
        "Long term secondary oxygen sensor trim bank 2 and bank 4",
        "Fuel rail pressure (absolute)",
        "Relative accelerator pedal position",
        "Hybrid battery pack remaining life",
        "Engine oil temperature",
        "Fuel injection timing",
        "Engine fuel rate",
        "Emission requirements to which vehicle is designed",
        "PIDs supported [61 - 80]",
        "Driver's demand engine - percent torque",
        "Actual engine - percent torque",
        "Engine reference torque",
        "Engine percent torque data",
        "Auxiliary input / output supported",
        "Mass air flow sensor",
        "Engine coolant temperature",
        "Intake air temperature sensor",
        "Commanded EGR and EGR Error",
        "Commanded Diesel intake air flow control and relative intake air flow position",
        "Exhaust gas recirculation temperature",
        "Commanded throttle actuator control and relative throttle position",
        "Fuel pressure control system",
        "Injection pressure control system",
        "Turbocharger compressor inlet pressure",
        "Boost pressure control",
        "Variable Geometry turbo (VGT) control",
        "Wastegate control",
        "Exhaust pressure",
        "Turbocharger RPM",
        "Turbocharger temperature",
        "Turbocharger temperature",
        "Charge air cooler temperature (CACT)",
        "Exhaust Gas temperature (EGT) Bank 1",
        "Exhaust Gas temperature (EGT) Bank 2",
        "Diesel particulate filter (DPF)",
        "Diesel particulate filter (DPF)",
        "Diesel Particulate filter (DPF) temperature",
        "NOx NTE control area status",
        "PM NTE control area status",
        "Engine run time",
        "PIDs supported [81 - A0]",
        "Engine run time for Auxiliary Emissions Control Device(AECD)",
        "Engine run time for Auxiliary Emissions Control Device(AECD)",
        "NOx sensor",
        "Manifold surface temperature",
        "NOx reagent system",
        "Particulate matter (PM) sensor",
        "Intake manifold absolute pressure"
    ],

    obdStandards: {
        1 : "OBD-II as defined by the CARB",
        2 : "OBD as defined by the EPA",
        3 : "OBD and OBD-II",
        4 : "OBD-I",
        5 : "Not OBD compliant",
        6 : "EOBD (Europe)",
        7 : "EOBD and OBD-II",
        8 : "EOBD and OBD",
        9 : "EOBD, OBD and OBD II",
        10: "JOBD (Japan)",
        11: "JOBD and OBD II",
        12: "JOBD and EOBD",
        13: "JOBD, EOBD, and OBD II",
        17: "Engine Manufacturer Diagnostics (EMD)",
        18: "Engine Manufacturer Diagnostics Enhanced (EMD+)",
        19: "Heavy Duty On-Board Diagnostics (Child/Partial) (HD OBD-C)",
        20: "Heavy Duty On-Board Diagnostics (HD OBD)",
        21: "World Wide Harmonized OBD (WWH OBD)",
        23: "Heavy Duty Euro OBD Stage I without NOx control (HD EOBD-I)",
        24: "Heavy Duty Euro OBD Stage I with NOx control (HD EOBD-I N)",
        25: "Heavy Duty Euro OBD Stage II without NOx control (HD EOBD-II)",
        26: "Heavy Duty Euro OBD Stage II with NOx control (HD EOBD-II N)",
        28: "Brazil OBD Phase 1 (OBDBr-1)",
        29: "Brazil OBD Phase 2 (OBDBr-2)",
        30: "Korean OBD (KOBD)",
        31: "India OBD I (IOBD I)",
        32: "India OBD II (IOBD II)",
        33: "Heavy Duty Euro OBD Stage VI (HD EOBD-IV)"
    },

    vehicleInfoPids: [
        "Mode 9 supported PIDs (01 to 20)",
        "VIN Message Count in PID 02.",
        "Vehicle Identification Number (VIN)",
        "Calibration ID message count for PID 04.",
        "Calibration ID",
        "Calibration verification numbers (CVN) message count for PID 06.",
        "Calibration Verification Numbers (CVN)",
        "In-use performance tracking message count for PID 08 and 0B.",
        "In-use performance tracking for spark ignition vehicles",
        "ECU name message count for PID 0A",
        "ECU name",
        "In-use performance tracking for compression ignition vehicles"
    ],

    decodeSupportedPids: function(bytes, startingPid) {
        var pids = [];
        var pid = startingPid;
        for(var b = 0; b < bytes.length; b++) {
            for(var bit = 7; bit >= 0; bit--) {
                if ((bytes[b] & (0x01 << bit)) != 0)
                    pids.push({ id: pid, name: this.standardPids[pid] });
                pid++;
            }
        }
        return pids;
    },

    decodeSupportedInfo: function(bytes) {
        var pids = [], pid = 1;
        for(var b = 0; b < bytes.length; b++) {
            for(var bit = 7; bit >= 0; bit--) {
                if ((bytes[b] & (0x01 << bit)) != 0)
                    pids.push({ id: pid, name: this.vehicleInfoPids[pid] });
                pid++;
            }
        }
        return pids;
    },

    decodePidData: function(pid, bytes) {
        switch (pid) {
            case 0x01:
                /** The first byte(A) contains two pieces of information.
                 * Bit A7 (MSB of byte A, the first byte) indicates whether or not the MIL (check engine light) is illuminated.
                 * Bits A6 through A0 represent the number of diagnostic trouble codes currently flagged in the ECU.
                 */
                var MIL = ((bytes[0] & 0x80) != 0);
                var DTC_CNT = (bytes[0] & 0x7F);
                var tests = "- MIL (check engine light) is " + (MIL? "" : "NOT ") + "illuminated\r\n" +
                    "- " + DTC_CNT + " trouble code(s) currently flagged in the ECU\r\n";

                /**
                 * The second, third, and fourth bytes(B, C and D) give information about the availability and
                 * completeness of certain on-board tests.
                 */
                var ignition_type = ((bytes[1] & 0x08) == 0)? "Spark" : "Compression";
                tests += "- " + ignition_type + " ignition monitors supported\r\n";

                if ((bytes[1] & 0x01) != 0)
                    tests += "- Misfire test " + (((bytes[1] & 0x10) == 0)? "" : "in") + "complete\r\n";
                if ((bytes[1] & 0x02) != 0)
                    tests += "- Fuel System test " + (((bytes[1] & 0x20) == 0)? "" : "in") + "complete\r\n";
                if ((bytes[1] & 0x04) != 0)
                    tests += "- Components test " + (((bytes[1] & 0x40) == 0)? "" : "in") + "complete\r\n";

                if ((bytes[2] & 0x01) != 0)
                    tests += "- Catalyst test " + (((bytes[3] & 0x01) == 0)? "" : "in") + "complete\r\n";
                if ((bytes[2] & 0x02) != 0)
                    tests += "- Heated Catalyst test " + (((bytes[3] & 0x02) == 0)? "" : "in") + "complete\r\n";
                if ((bytes[2] & 0x04) != 0)
                    tests += "- Evaporative System test " + (((bytes[3] & 0x04) == 0)? "" : "in") + "complete\r\n";
                if ((bytes[2] & 0x08) != 0)
                    tests += "- Secondary Air System test " + (((bytes[3] & 0x08) == 0)? "" : "in") + "complete\r\n";
                if ((bytes[2] & 0x10) != 0)
                    tests += "- A/C Refrigerant test " + (((bytes[3] & 0x10) == 0)? "" : "in") + "complete\r\n";
                if ((bytes[2] & 0x20) != 0)
                    tests += "- Oxygen Sensor test " + (((bytes[3] & 0x20) == 0)? "" : "in") + "complete\r\n";
                if ((bytes[2] & 0x40) != 0)
                    tests += "- Oxygen Sensor Heater test " + (((bytes[3] & 0x40) == 0)? "" : "in") + "complete\r\n";
                if ((bytes[2] & 0x80) != 0)
                    tests += "- EGR System test " + (((bytes[3] & 0x80) == 0)? "" : "in") + "complete\r\n";

                return { content: tests };

            case 0x04:
            case 0x11:
                return { value: bytes[0] * 100 / 255, unit: "%" };

            case 0x05:
            case 0x0F:
                return { value: bytes[0] - 40, unit: "°C" };

            case 0x06:
            case 0x07:
            case 0x08:
            case 0x09:
                return { value: (bytes[0] - 128) * 100/128, unit: "%" };

            case 0x0A:
                return { value: bytes[0]*3, unit: "kPa (gauge)" };

            case 0x0B:
                return { value: bytes[0], unit: "kPa (gauge)" };

            case 0x0C:
                return { value: ((bytes[0] * 256) + bytes[1]) / 4, unit: "RPM" };

            case 0x0D:
                return { value: bytes[0], unit: "km/h" };

            case 0x10:
                return { value: ((bytes[0] * 256) + bytes[1]) / 100, unit: "grams/sec" };

            case 0x1C:
                return {
                    content: this.obdStandards.hasOwnProperty(bytes[0])? this.obdStandards[bytes[0]]
                        : "Unknown standard (" + bytes[0] + ")"
                };

            case 0x21:
                return { value: (bytes[0] * 256) + bytes[1], unit: "km" };

            case 0x23:
                return { value: ((bytes[0] * 256) + bytes[1]) * 10, unit: "kPa (gauge)" };

            default:
                return { content: "Decoding of this PID isn't implemented yet." };
        }
    },

    bytes2hex: function(bytes) {
        var str = "";
        for(var b = 0; b < bytes.length; b++)
            str += ((bytes[b] < 16) ? " 0" : " ") + bytes[b].toString(16).toUpperCase();
        return str.substr(1);
    },

    decodeDTC: function(bytes) {
        var code;
        switch(bytes[0] >> 6) {
            case 0:
                code = "P"; // Powertrain
                break;
            case 1:
                code = "C"; // Chassis
                break;
            case 2:
                code = "B"; // Body
                break;
            case 3:
                code = "U"; // Network
                break;
        }
        return code + (bytes[0] & 0x3F).toString(16).toUpperCase() + bytes[1].toString(16).toUpperCase();
    }
};