import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "../../../src/assets/fonts/vfs_fonts";
import { format } from "date-fns";

pdfMake.vfs = pdfFonts.vfs;

pdfMake.fonts = {
    Arial: {
        normal: "arial.ttf",
        bold: "arialbd.ttf",
        italics: "ariali.ttf",
        bolditalics: "arialbi.ttf"
    }
};

export const printEquipmentUsageLog = (equipmentLogList, equipmentName, fromDateValue, toDateValue, equipmentList) => {
    const tableBody = [];
    const fromDate = format(new Date(fromDateValue), "dd-MM-yyyy");
    const toDate = format(new Date(toDateValue), "dd-MM-yyyy");
    const equipmentData = equipmentList.find(e => e.equipmentName === equipmentName) || {};
    // Table Header
    tableBody.push([
        { text: "SN",          style: "tableHeader" },
        { text: "Start Time",  style: "tableHeader" },
        { text: "End Time",    style: "tableHeader" },
        { text: "Total Hrs",   style: "tableHeader" },
        { text: "Description", style: "tableHeader" },
        { text: "Used By",     style: "tableHeader" }
    ]);

    // Table Rows
    equipmentLogList.forEach((item, index) => {
        tableBody.push([
            index + 1,
            item.startTime ? item.startTime : "-",
            item.endTime   ? item.endTime   : "-",
            { text: item.totalHours || "", alignment: "right" },
            item.description || "",
            item.usedByName  || ""
        ]);
    });

    // Equipment fields — 6 items
    const equipmentFields = [
        { label: "Name of the Equipment",         value: equipmentData?.equipmentName   || "" },
        { label: "Equipment Serial No.",          value: equipmentData?.itemSerialNumber || "" },
        { label: "Make / Model",                  value: `${equipmentData?.make || ""}/${equipmentData?.model || ""}` },
        { label: "Warranty",                      value: equipmentData?.warranty        || "" },
        { label: "Division Holding with SSR NO.", value: equipmentData?.ssrNo           || "" },
        { label: "Project Code",                  value: equipmentData?.projectCode     || "" },
    ];

    // Chunk into 3 paired rows (2 fields per row)
    const infoRows = [];
    for (let i = 0; i < equipmentFields.length; i += 2) {
        const left  = equipmentFields[i];
        const right = equipmentFields[i + 1] || { label: "", value: "" };
        infoRows.push([
            { text: left.label,  style: "infoLabel" },
            { text: left.value,  style: "infoValue" },  // pdfmake wraps automatically within column width
            { text: right.label, style: "infoLabel" },
            { text: right.value, style: "infoValue" },
        ]);
    }

    const equipmentInfoTable = {
        style: "tableStyle",
        table: {
            widths: [120, 263, 120, 263],  // label=fixed, value=flexible — text wraps inside "*" cols
            body: infoRows
        },
        layout: {
            hLineColor: "#aaa",
            vLineColor: "#aaa",
        }
    };

    // Page width for A3 = 841.89pt, minus margins (20 each side) = ~802pt available
    const docDefinition = {
        pageSize: "A4",
        pageOrientation: "landscape",   // ← landscape gives much more horizontal space
        pageMargins: [20, 20, 20, 20],

        content: [
            {
                text: "Equipment Usage Log Report",
                style: "title",
                margin: [0, 0, 0, 10]
            },
            {
                alignment: "center",
                margin: [0, 0, 0, 10],
                fontSize: 12,
                text: [
                    "Equipment : ",
                    { text: equipmentName, color: "blue", bold: true },
                    "     From : ",
                    { text: fromDate, color: "blue", bold: true },
                    "     To : ",
                    { text: toDate, color: "blue", bold: true }
                ]
            },

            equipmentInfoTable,

            {
                style: "tableStyle",
                table: {
                    headerRows: 1,
                    widths: ["auto", "auto", "auto", "auto", "*", "*"],
                    body: tableBody,
                },
                layout: {
                    fillColor: (rowIndex) => rowIndex === 0 ? "#AED6F1" : null,
                    hLineColor: "#aaa",
                    vLineColor: "#aaa",
                }
            }
        ],

        styles: {
            title: {
                fontSize: 16,
                bold: true,
                alignment: "center",
            },
            tableHeader: {
                bold: true,
                fontSize: 12,
                alignment: "center"
            },
            tableStyle: {
                margin: [0, 5, 0, 15]
            },
            infoLabel: {
                bold: true,
                fontSize: 10,
            },
            infoValue: {
                fontSize: 10,
            }
        },

        defaultStyle: {
            fontSize: 10,
            font: "Arial",
        },
    };

    pdfMake.createPdf(docDefinition).open();
};