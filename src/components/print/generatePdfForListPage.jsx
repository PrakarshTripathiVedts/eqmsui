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


// Convert Bootstrap alignment to pdfMake alignment
const getPdfAlignment = (align) => {
    switch (align) {
        case "text-center":
            return "center";

        case "text-end":
            return "right";

        case "text-start":
            return "left";

        default:
            return "left";
    }
};


export const generatePdfForListPage = ({
    title,
    columns,
    data,
    fileName = "report",
    orientation = "landscape",
    details = {}
}) => {

    // Remove columns that should not appear in PDF
    const pdfColumns = columns.filter(
        (column) => !column.pdfExclude
    );


    // --------------------------------
    // TABLE HEADERS
    // --------------------------------

    const headers = pdfColumns.map((column) => ({
        text: column.name,
        style: "tableHeader",
        alignment: "center"
    }));


    // --------------------------------
    // TABLE ROWS
    // --------------------------------

    const rows = data.map((row) =>
        pdfColumns.map((column) => {

            let value = "";

            if (typeof column.selector === "function") {
                value = column.selector(row);
            }

            // Optional PDF formatter
            if (typeof column.pdfFormatter === "function") {
                value = column.pdfFormatter(value, row);
            }

            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {
                value = "-";
            }

            return {
                text: String(value),
                alignment: getPdfAlignment(column.align),
                fontSize: 8
            };
        })
    );


    // --------------------------------
    // DETAILS / LABEL-VALUE SECTION
    // --------------------------------

    const detailEntries = Object.entries(details);

    const detailBody = [];

    for (let i = 0; i < detailEntries.length; i += 2) {

        const first = detailEntries[i];
        const second = detailEntries[i + 1];

        detailBody.push([
            {
                text: first
                    ? `${first[0]}:`
                    : "",
                bold: true
            },
            {
                text: first
                    ? String(first[1] ?? "-")
                    : ""
            },
            {
                text: second
                    ? `${second[0]}:`
                    : "",
                bold: true
            },
            {
                text: second
                    ? String(second[1] ?? "-")
                    : ""
            }
        ]);
    }


    // --------------------------------
    // CONTENT
    // --------------------------------

    const content = [

        // Title
        {
            text: title,
            style: "title",
            alignment: "center",
            margin: [0, 0, 0, 10]
        },


        // Details
        ...(detailBody.length > 0
            ? [
                {
                    table: {
                        widths: ["auto", "auto", "auto", "auto"],
                        body: detailBody
                    },

                    layout: {
                        hLineWidth: () => 0,
                        vLineWidth: () => 0,

                        paddingLeft: () => 3,
                        paddingRight: () => 8,
                        paddingTop: () => 3,
                        paddingBottom: () => 3
                    },

                    margin: [0, 0, 0, 10]
                }
            ]
            : []),


        // Main table
        {
            table: {
                headerRows: 1,

                widths: pdfColumns.map(() => "*"),

                body: [
                    headers,
                    ...rows
                ]
            },

            layout: {

                fillColor: (rowIndex) =>
                    rowIndex === 0
                        ? "#9fc5ec"
                        : null,

                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,

                hLineColor: () => "#999999",
                vLineColor: () => "#999999",

                paddingLeft: () => 4,
                paddingRight: () => 4,
                paddingTop: () => 4,
                paddingBottom: () => 4
            }
        }
    ];


    // --------------------------------
    // PDF DEFINITION
    // --------------------------------

    const docDefinition = {

        pageOrientation: orientation,

        pageMargins: [20, 30, 20, 30],

        defaultStyle: {
            font: "Arial",
            fontSize: 8
        },

        content,

        styles: {

            title: {
                fontSize: 16,
                bold: true,
                decoration: "underline"
            },

            tableHeader: {
                bold: true,
                fontSize: 8,
                alignment: "center"
            }
        }
    };


    // --------------------------------
    // OPEN PDF
    // --------------------------------

    pdfMake
        .createPdf(docDefinition)
        .open();
};