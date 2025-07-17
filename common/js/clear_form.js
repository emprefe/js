// common/js/clear_form.js

function clearForm(formId, excludeElements) {
  var form = document.getElementById(formId);

  if (form) {
    for (var i = 0; i < form.elements.length; i++) {
      var field = form.elements[i];

      if (excludeElements.includes(field.name)) {
        continue;
      }

      switch (field.type) {
        case "text":
        case "email":
        case "password":
        case "textarea":
        case "file":
        case "number":
        case "date":
          field.value = "";
          break;
        case "checkbox":
        case "radio":
          field.checked = false;
          break;
        case "select-one":
        case "select-multiple":
          field.selectedIndex = -1;
          break;
        default:
          break;
      }
    }

    // Ensure the submit button resets properly
    var submitButton = document.getElementById("submit-button");
    if (submitButton) {
      submitButton.value = "To send a message, please fill out the form above."; // Reset text
      submitButton.style.color = "white"; // Reset text
      submitButton.disabled = true; // Disable the button
    }
  } else {
    console.warn("No form found with ID:", formId);
  }
}


// To clear a form with the ID 'myForm' but exclude elements with the names 'username' and 'email', you would call the function like this:
//clearForm('myForm', ['username', 'email']);
