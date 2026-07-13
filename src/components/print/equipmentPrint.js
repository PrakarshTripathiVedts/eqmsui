import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { format } from "date-fns";


pdfMake.vfs = pdfFonts.vfs;

export const printEquipmentDownload = (data) => {

    const getVal = (key) => data[key] || '';

    const tableBody = [

        [
            { text: "EQUIPMENT ", style: "tableHeaderCell" },

            { text: getVal("equipmentName") || "", colSpan: 3, style: "tableDataCell" },
            {},
            {},
            { text: "ITEM SERIAL NUMBER", style: "tableHeaderCell" },
            { text: getVal("itemSerialNumber") || "-", style: "tableDataCell" },
        ],

        [
            { text: "MAKE", style: "tableHeaderCell" },

            { text: getVal("make") || "-", colSpan: 3, style: "tableDataCell" },
            {},
            {},
            { text: "MODEL", style: "tableHeaderCell" },
            { text: getVal("model") || "", style: "tableDataCell" },
        ],


        [
            { text: "SO NO", style: "tableHeaderCell" },

            { text: getVal("soNo"), colSpan: 3, style: "tableDataCell" },
            {},
            {},
            { text: "SO DATE", style: "tableHeaderCell" },
            { text: format(new Date(getVal("soDate")), "dd-MM-yyyy"), style: "tableDataCell" },
        ],

        [
            { text: "ITEM COST", style: "tableHeaderCell" },

            { text: getVal("itemCost") || "-", colSpan: 3, style: "tableDataCell" },
            {},
            {},
            { text: "PARENT LOCATION.", style: "tableHeaderCell" },
            { text: getVal("parentLocation") || "-", style: "tableDataCell" },
        ],



        [
            { text: "REMARKS", style: "tableHeaderCell" },

            { text: getVal("remarks"), colSpan: 3, style: "tableDataCell" },
            {},
            {},
            { text: "INITIATION OFFICER.", style: "tableHeaderCell" },
            { text: getVal("initiateOfficerName") || "-", style: "tableDataCell" },
        ],

        [
            { text: "PROJECT", style: "tableHeaderCell" },

            { text: getVal("projectName"), colSpan: 3, style: "tableDataCell" },
            {},
            {},
            { text: "SPECIFICATION.", style: "tableHeaderCell" },
            { text: getVal("specification") || "-", style: "tableDataCell" },
        ],

        [
            { text: "PHOTO UPLOAD", style: "tableHeaderCell" },

            { text: getVal("photoName") || "-", colSpan: 3, style: "tableDataCell" },
            {},
            {},
            { text: "FILE UPLOAD.", style: "tableHeaderCell" },
            { text: getVal("fileName") || "-", style: "tableDataCell" },
        ],


        [
            { text: "SSR NO", style: "tableHeaderCell" },

            { text: getVal("ssrNo"), colSpan: 3, style: "tableDataCell" },
            {},
            {},
            { text: "SERVICE STATUS.", style: "tableHeaderCell" },
            { text: getVal("serviceStatus") === "N" ? "Not Working" : "Working", style: "tableDataCell" },
        ],



    ];

    const docDefinition = {
        pageSize: "A4",
        pageOrientation: "landscape",
        pageMargins: [20, 20, 20, 20],

        content: [

            { text: "EQUIPMENT DETAILS", style: "tableMainTitle" },


            {
                style: "tableStyle",
                table: {

                    widths: ['15%', '10%', '10%', '10%', '20%', '35%'],
                    body: tableBody,
                },
                layout: {
                    paddingTop: function (rowIndex, node) {
                        return 10; // increase as needed
                    },
                    paddingBottom: function (rowIndex, node) {
                        return 10;
                    },

                    hLineWidth: function (i, node) { return 1; },
                    vLineWidth: function (i, node) { return 1; },
                    hLineColor: function (i, node) { return '#000000'; },
                    vLineColor: function (i, node) { return '#000000'; },
                }
            },

        ],

        styles: {
            title: {
                fontSize: 16,
                bold: true,
                alignment: "left",
                margin: [0, 0, 0, 10]
            },
            tableMainTitle: {
                fontSize: 14,
                bold: true,
                alignment: "center",
                margin: [0, 0, 0, 15]
            },
            tableHeaderCell: {
                bold: true,
                fontSize: 10,
                alignment: "left",
                fillColor: '#AEDEFC', // Optional: Light background for headers
                padding: [5, 5, 5, 50],
            },
            tableDataCell: {
                fontSize: 10,
                alignment: "left",
                padding: [5, 5, 5, 50],
            },
            tableStyle: {
                margin: [0, 5, 0, 15]
            }
        }
    };

    pdfMake.createPdf(docDefinition).open();
};
