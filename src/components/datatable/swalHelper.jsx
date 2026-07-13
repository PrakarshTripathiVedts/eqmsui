// src/utils/swalHelper.js
import Swal from "sweetalert2";

export const showAlert = (title, text, icon = "info") => {
  Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: "OK",
    timer: 3000,
    customClass: {
        confirmButton: "submit",
      },
  });
};

export const showConfirmation = async () => {
  const result = await Swal.fire({
    title: "Are you sure to submit?",
    //text: "You can't undo this!",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Submit",
    cancelButtonText: "Cancel",
    customClass: {
        confirmButton: "submit",
        cancelButton: "delete"
      },
  });

  return result.isConfirmed;
};

export const showConfirmationResetPassword = async () => {
  const result = await Swal.fire({
    title: "Are you sure you want to reset the password?",
    //text: "You can't undo this!",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Submit",
    cancelButtonText: "Cancel",
    customClass: {
        confirmButton: "submit",
        cancelButton: "delete"
      },
  });

  return result.isConfirmed;
};
