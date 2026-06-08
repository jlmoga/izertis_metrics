// =============================================================================
// EXCEL — Parsejat d'arxius Excel via SheetJS (XLSX global de CDN)
// =============================================================================

import { normalizeName } from '../utils.js';

export function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            try {
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                let json = XLSX.utils.sheet_to_json(worksheet);

                json = json.map(row => {
                    const date = row['DATE'] || row['Date'] || row['Data'] || '';
                    const parsedDate = date instanceof Date ? date.toLocaleDateString() : date;
                    const user = row['USER'] || row['User'] || '';
                    const client = row['CLIENT'] || row['Client'] || '';
                    const project = row['PROJECT'] || row['Project'] || '';
                    const task = row['TASK'] || row['Task'] || '';

                    const isBillableRaw = row['IS BILLABLE'] !== undefined
                        ? row['IS BILLABLE']
                        : (row['Is Billable'] !== undefined ? row['Is Billable'] : false);
                    let isBillable = false;
                    if (typeof isBillableRaw === 'boolean') isBillable = isBillableRaw;
                    else if (typeof isBillableRaw === 'string') isBillable = ['yes', 'true', 'sí', 'si', '1'].includes(isBillableRaw.toLowerCase());
                    else if (typeof isBillableRaw === 'number') isBillable = isBillableRaw === 1;

                    const rate = parseFloat(row['BILLABLE RATE'] || row['Billable Rate'] || 0);
                    const hours = parseFloat(row['TOTAL HOURS'] || row['Total Hours'] || 0);
                    const calcAmount = rate * hours;

                    return {
                        date: parsedDate,
                        user: normalizeName(user),
                        client, project, task, isBillable,
                        rate: isNaN(rate) ? 0 : rate,
                        hours: isNaN(hours) ? 0 : hours,
                        _importedCalculated: isNaN(calcAmount) ? 0 : calcAmount
                    };
                });

                resolve(json);
            } catch (err) { reject(err); }
        };
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
    });
}

export function readAbsenceFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            try {
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(worksheet);

                const result = json.map(row => {
                    const rowKeys = Object.keys(row);
                    const rowKeysLower = rowKeys.map(k => k.toLowerCase().trim());
                    const getV = (labels) => {
                        for (const l of labels) {
                            const idx = rowKeysLower.indexOf(l.toLowerCase().trim());
                            if (idx !== -1) return row[rowKeys[idx]];
                        }
                        return undefined;
                    };

                    const user = getV(['Nom del sol·licitant', 'Nombre del solicitante', 'Solicitant']) || '';
                    const approver = getV(["Nom de l'aprovador", 'Nombre del aprobador', 'Aprovador', 'Aprobador', 'Aprovat per']) || '';
                    const type = getV(['Tipus', 'Tipo', "Tipus d'absència", 'Tipo de ausencia']) || '';
                    const status = getV(['Estat de la sol·licitud', 'Estado de la solicitud', 'Estat', 'Estado']) || '';

                    const dateStartRaw = getV(["Data d'inici de la sol·licitud", 'Fecha de inicio de la solicitud', 'Data inici', 'Fecha inicio', 'Inici']) || '';
                    const dateEndRaw = getV(['Data de finalització de la sol·licitud', 'Fecha de finalización de la solicitud', 'Data fi', 'Fecha fin', 'Finalització']) || '';
                    const dateStart = dateStartRaw instanceof Date ? dateStartRaw.toLocaleDateString() : dateStartRaw;
                    const dateEnd = dateEndRaw instanceof Date ? dateEndRaw.toLocaleDateString() : dateEndRaw;

                    const days = getV(["Dies laborals d'absència", "Dies laborals dabsència", 'Días laborales de ausencia']) || 0;
                    const minutesRaw = getV(["Minuts laborals d'absència", "Minuts laborals dabsència", 'Minutos laborales de ausencia', 'Minutos']) || 0;
                    const hours = parseFloat(minutesRaw) / 60;
                    const consumesTime = getV(['Consumeix temps', 'Consume tiempo']) || '';

                    return { user: normalizeName(user), approver, type, status, dateStart, dateEnd, days, hours, consumesTime };
                });

                resolve(result);
            } catch (err) { reject(err); }
        };
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
    });
}
