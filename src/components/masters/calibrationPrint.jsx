import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "../../../src/assets/fonts/vfs_fonts";

pdfMake.vfs = pdfFonts.vfs;

pdfMake.fonts = {
    Arial: {
        normal: "arial.ttf",
        bold: "arialbd.ttf",
        italics: "ariali.ttf",
        bolditalics: "arialbi.ttf"
    }
};

function formatDate(date) {
    if (!date) return "-";

    const parts = date.split("-");
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    return date;
}

export const generateCalibrationPdf = (data, equipment) => {
    const docDefinition = {
        pageSize: "A4",
        pageMargins: [40, 50, 40, 50],

        // Draws a rounded border on every page
        background(currentPage, pageSize) {
            return {
                svg: `
  <svg width="${pageSize.width}" height="${pageSize.height}">
    <rect
      x="10"
      y="10"
      width="${pageSize.width - 20}"
      height="${pageSize.height - 20}"
      rx="12"
      ry="12"
      fill="none"
      stroke="#000000"
      stroke-width="1"
    />
  </svg>
`
            };
        },

        content: [
            {
                text: "CALIBRATION REPORT",
                style: "header",
                alignment: "center",
                margin: [0, 0, 0, 20],
            },

            // Equipment Details
            {
                text: "Equipment Details",
                style: "subHeader",
            },

            {
                table: {
                    widths: ["25%", "25%", "25%", "25%"],
                    body: [
                        [
                            { text: "Equipment Name", bold: true },
                            { text: "Make", bold: true },
                            { text: "Model", bold: true },
                            { text: "Serial No", bold: true },
                        ],
                        [
                            equipment?.equipmentName || "-",
                            equipment?.make || "-",
                            equipment?.model || "-",
                            equipment?.itemSerialNumber || "-",
                        ],
                    ],
                },
                layout: {
                    paddingTop: function () { return 8; },
                    paddingBottom: function () { return 8; },
                    paddingLeft: function () { return 6; },
                    paddingRight: function () { return 6; },
                    hLineWidth: function (i) { return i === 0 || i === 1 ? 0.5 : 0; },
                    vLineWidth: function () { return 0; },
                    hLineColor: function () { return "#dddddd"; },
                    fillColor: function (rowIndex) {
                        return rowIndex === 0 ? "#E8EAF6" : null;
                    },
                },
                margin: [0, 0, 0, 20],
            },

            {
                text: "Calibration Details",
                style: "subHeader",
            },

            {
                table: {
                    widths: ["35%", "*"],
                    body: [
                        [
                            { text: "Calibration Type", bold: true },
                            data.calibrationType === "I" ? "In House" : "Out House",
                        ],
                        [
                            { text: "Calibration Agency", bold: true },
                            data.calibrationAgency || "-",
                        ],
                        [
                            { text: "Period of Calibration", bold: true },
                            `${data.periodOfCalibration || "-"} Month(s)`,
                        ],
                        [
                            { text: "Last Calibration Date", bold: true },
                            formatDate(data.calibrationDate),
                        ],
                        [
                            { text: "Calibration Due Date", bold: true },
                            formatDate(data.calibrationDueDate),
                        ],
                        [
                            { text: "Calibrated By", bold: true },
                            data.calibratedBy || "-",
                        ],
                        [
                            { text: "Remarks", bold: true },
                            data.remarks || "-",
                        ],
                    ],
                },
                layout: {
                    paddingTop: function () { return 8; },
                    paddingBottom: function () { return 8; },
                    paddingLeft: function () { return 6; },
                    paddingRight: function () { return 6; },
                    hLineWidth: function () { return 0.5; },
                    vLineWidth: function () { return 0; },
                    hLineColor: function () { return "#dddddd"; },
                    fillColor: function (rowIndex, node, columnIndex) {
                        return columnIndex === 0 ? "#E8EAF6" : null;
                    },
                },
            },
        ],

        styles: {
            header: {
                fontSize: 18,
                bold: true,
            },
            subHeader: {
                fontSize: 14,
                bold: true,
                margin: [0, 10, 0, 8],
            },
        },

        defaultStyle: {
            fontSize: 10,
            font: "Arial",
        },
    };

    //   pdfMake.createPdf(docDefinition).download(
    //     `Calibration_${data.calibrationId || "Report"}.pdf`
    //   );

    pdfMake.createPdf(docDefinition).open();
};