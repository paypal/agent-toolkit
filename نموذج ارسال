document.addEventListener("DOMContentLoaded", function () {
    const submitButton = document.getElementById("submit-button");
    const paymentConfirmation = document.querySelector(".payment-confirmation");
    const successMessage = document.querySelector(".success-message");
    const returnButton = document.getElementById("return-button");
    const amountInput = document.getElementById("amount");
    const emailInput = document.getElementById("email");
    const amountValue = document.querySelector(".big-number");
    const amountValueText = amountValue.textContent.trim();
    const amountFloat = parseFloat(amountValueText.replace(/[^0-9.]/g, ''));

    submitButton.addEventListener("click", function (event) {
        event.preventDefault();

        // Show loading spinner
        const loadingSpinner = document.createElement("div");
        loadingSpinner.classList.add("loading-spinner");
        submitButton.appendChild(loadingSpinner);

        // Disable the submit button
        submitButton.disabled = true;

        // Check if the amount and email fields are filled
        if (amountInput.value && emailInput.value) {
            // Delay for 2 seconds before proceeding
            setTimeout(function () {
                // Remove loading spinner
                loadingSpinner.remove();

                // Enable the submit button
                submitButton.disabled = false;

                // Update the big number by decreasing the entered amount
                const enteredAmount = parseFloat(amountInput.value);
                if (!isNaN(enteredAmount)) {
                    const newAmount = amountFloat - enteredAmount;
                    amountValue.textContent = formatCurrency(newAmount);
                }

                // Hide the payment confirmation and show the success message
                paymentConfirmation.style.display = "none";
                successMessage.style.display = "block";

                // Set the values in the success message
                document.getElementById("amount-value").textContent = amountInput.value;
                document.getElementById("email-value").textContent = emailInput.value;

                // Clear form fields
                amountInput.value = "";
                emailInput.value = "";
            }, 2000); // Wait for 2 seconds before proceeding
        } else {
            alert("Please fill in all fields.");

            // Remove loading spinner
            loadingSpinner.remove();

            // Enable the submit button
            submitButton.disabled = false;
        }
    });

    returnButton.addEventListener("click", function () {
        // Hide the success message and show the payment confirmation
        successMessage.style.display = "none";
        paymentConfirmation.style.display = "block";
    });

    // Function to format currency
    function formatCurrency(value) {
        return "$" + value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
    }
});
