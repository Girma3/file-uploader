const signInModal = document.querySelector("[data-name='sign-in-modal']");
const signInBtn = document.querySelector("[data-name='sign-in-btn']");
const signInForm = document.querySelector("[data-name='sign-in-form']");

const errSignInSpans = signInForm.querySelectorAll(".err-msg");
//
const logInModal = document.querySelector("[data-name='log-in-modal']");
const logInForm = document.querySelector("[data-name='log-in-form']");
const logInBtn = document.querySelector("[data-name='log-in-btn']"); // err msg log in
const logInFormInputs = logInForm.querySelectorAll("input");
const errLogInSpans = logInForm.querySelectorAll(".err-msg");
//function that accept spans and msg as an array from backend to show error msg
function showFormErrMsg(spanArray, msgArray) {
  // create a map for quick lookup of messages
  const msgMap = new Map(msgArray.map((msg) => [msg.path, msg.msg]));

  spanArray.forEach((span) => {
    const field = span.dataset.field;
    // check if there's a corresponding message
    if (msgMap.has(field)) {
      span.textContent = msgMap.get(field); // set the error msg
      span.style.display = "block";
      msgMap.delete(field); // remove the msg to prevent reuse
    } else {
      span.style.display = "none";
    }
  });
}
//function to hide err msg when input on focus (used later)
function hideErrMsg(errSpans, input) {
  errSpans.forEach((span) => {
    if (span.dataset.field == input.name) {
      span.style.display = "none";
    }
  });
}
function clearErrMsg(eleArray) {
  eleArray.forEach((span) => {
    span.textContent = "";
  });
}

logInBtn.addEventListener("click", () => {
  logInModal.showModal();
  signInModal.close();
});
signInBtn.addEventListener("click", () => {
  signInModal.showModal();
  logInModal.close();
});
//
signInModal.addEventListener("click", (e) => {
  if (e.target.matches("[data-name='close-btn']")) {
    signInModal.close();
  } else if (e.target.matches(".show-btn")) {
    const input = document.querySelector("#userPassword");
    togglePassword(input);
  }
});
logInModal.addEventListener("click", (e) => {
  //e.preventDefault();
  if (e.target.matches("[data-name='close-btn']")) {
    logInModal.close();
  } else if (e.target.matches(".show-btn")) {
    const input = document.querySelector("#logInPassword");
    togglePassword(input);
  }
});
function togglePassword(input) {
  if (!input) return;
  if (input.type == "password") {
    input.type = "text";
  } else {
    input.type = "password";
  }
}
//

if (signInForm) {
  signInForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const endPoint = "/sign-in";
    const formData = new FormData(signInForm);
    const formJson = JSON.stringify(Object.fromEntries(formData.entries()));
    try {
      const response = await fetch(endPoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: formJson,
      });
      const result = await response.json();

      if (response.ok) {
        signInForm.reset();
        clearErrMsg(errSignInSpans);
        signInModal.close();
        window.location.href = result.redirect;
      } else {
        const errors = result.errors?.errors || [];
        showFormErrMsg(errSignInSpans, errors);
        signInForm
          .querySelectorAll("input")
          .forEach((input) =>
            input.addEventListener("input", () =>
              hideErrMsg(errSignInSpans, input)
            )
          );
      }
    } catch (err) {
      console.error("Error during sign-in:", err);
    }
  });
}

if (logInForm) {
  logInForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const endPoint = "/log-in";
    const formData = new FormData(logInForm);
    const formJson = JSON.stringify(Object.fromEntries(formData.entries()));

    try {
      const response = await fetch(endPoint, {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: formJson,
      });
      const result = await response.json();
      if (response.status === 200) {
        //reset form
        logInForm.reset();
        clearErrMsg(errLogInSpans);
        logInModal.close();
        window.location.href = result.redirect;
      } else if (response.status === 401) {
        //show errors and add event to hide on input
        const errors = result.errors;
        //show err if user not authenticated
        if (!errors && result.message) {
          errLogInSpans[0].textContent = result.message;
          return;
        }
        showFormErrMsg(errLogInSpans, errors);
        logInFormInputs.forEach((input) => {
          input.addEventListener("input", () => {
            hideErrMsg(errLogInSpans, input);
          });
        });
      }
    } catch (err) {
      console.log(err, "err while trying to log in msg.");
    }
  });
}
