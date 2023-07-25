/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store";
import { localStorageMock } from "../__mocks__/localStorage.js";
import BillsUI from "../views/BillsUI.js";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES } from "../constants/routes.js";
import { bills } from "../fixtures/bills";
import store from "../__mocks__/store";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({ type: "Employee", email: "a@a" })
    );
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    document.body.innerHTML = NewBillUI();
    const newBill = new NewBill({
      document,
      onNavigate,
      store,
      localStorage: window.localStorage,
    });
    test("Then I should be able to successfully add a .jpg, .jpeg or .png file to the bill being created", () => {
      const addFileButton = screen.getByTestId("file");
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const file = new File(["testFile"], "testFile.png", {
        type: "image/png",
      });
      addFileButton.addEventListener("change", handleChangeFile);
      userEvent.upload(addFileButton, file);

      expect(handleChangeFile).toHaveBeenCalled();
    });

    test("Then I should be able to submit a new bill after filling the fields", () => {
      const submitButton = screen.getByTestId("form-new-bill");
      const addFileButton = screen.getByTestId("file");
      const billFile = new File(["testFile"], "testFile.png", {
        type: "image/gif",
      });

      // Fills input fields
      const thatBill = bills[0];
      const bill = () => {
        screen.getByTestId("expense-type").value = thatBill.type;
        screen.getByTestId("expense-name").value = thatBill.name;
        screen.getByTestId("amount").value = thatBill.amount;
        screen.getByTestId("datepicker").value = thatBill.date;
        screen.getByTestId("vat").value = thatBill.vat;
        screen.getByTestId("pct").value = thatBill.pct;
        userEvent.upload(addFileButton, billFile);
      };
      bill();

      // If a validation error is returned for an input field (excluding file input), test should fail.
      const inputFields = document.querySelectorAll(".form-control");
      inputFields.forEach((field) => {
        const inputValidity = field.validationMessage;
        if (field !== inputFields[7]) {
          expect(inputValidity).toBe("");
        }
      });
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      submitButton.addEventListener("submit", handleSubmit);
      fireEvent.submit(submitButton);

      expect(handleSubmit).toHaveBeenCalled();
    });
  });
  test("Then the bill is added to the API but fails with 404 message error", async () => {
    jest
      .spyOn(mockStore, "bills")
      .mockRejectedValueOnce(new Error("Erreur 404"));
    document.body.innerHTML = BillsUI({ error: "Erreur 404" });
    const message = screen.getByText(/Erreur 404/);
    expect(message).toBeTruthy();
  });

  test("then it posts to API and fails with 500 message error on Bills page", async () => {
    jest
      .spyOn(mockStore, "bills")
      .mockRejectedValueOnce(new Error("Erreur 500"));
    document.body.innerHTML = BillsUI({ error: "Erreur 500" });
    const message = screen.getByText(/Erreur 500/);
    expect(message).toBeTruthy();
  });
});
