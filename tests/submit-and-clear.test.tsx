import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createFormControl, useField, useForm } from "../src";
import type { Resolver } from "../src";

interface Values {
  name: string;
}

interface CrossValues {
  a: string;
  b: string;
}

// b is invalid until a is filled — a cross-field rule.
const crossResolver: Resolver<CrossValues> = (values) => ({
  values,
  errors: values.a ? {} : { b: { message: "fill a first" } }
});

function CrossForm() {
  const form = useForm<CrossValues>({ mode: "onChange", resolver: crossResolver });
  const bState = useField(form.control, "b");
  return (
    <form>
      <input aria-label="a" {...form.register("a")} />
      <input aria-label="b" {...form.register("b")} />
      <span>{bState.error?.message ?? "b ok"}</span>
    </form>
  );
}

// Reads the error through useField (getFieldState), the path clearErrors' bug affected.
function ClearForm() {
  const form = useForm<Values>();
  const field = useField(form.control, "name");
  return (
    <form>
      <span>{field.error?.message ?? "no error"}</span>
      <button type="button" onClick={() => form.setError("name", { message: "boom" })}>set</button>
      <button type="button" onClick={() => form.clearErrors()}>clear</button>
    </form>
  );
}

describe("submit and clearErrors", () => {
  it("resets isSubmitting even when the submit handler throws", async () => {
    const control = createFormControl<Values>({ defaultValues: { name: "ok" } });
    const submit = control.handleSubmit(async () => {
      throw new Error("api failed");
    });

    await expect(submit()).rejects.toThrow("api failed");
    expect(control.getFormState().isSubmitting).toBe(false);
  });

  it("clearErrors() removes all errors from the UI", async () => {
    render(<ClearForm />);

    fireEvent.click(screen.getByText("set"));
    await waitFor(() => expect(screen.getByText("boom")).toBeTruthy());

    fireEvent.click(screen.getByText("clear"));
    await waitFor(() => expect(screen.getByText("no error")).toBeTruthy());
  });

  it("clears another field's resolver error when the field it depends on changes", async () => {
    render(<CrossForm />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText("b"), { target: { value: "x" } });
    });
    await waitFor(() => expect(screen.getByText("fill a first")).toBeTruthy());

    await act(async () => {
      fireEvent.change(screen.getByLabelText("a"), { target: { value: "filled" } });
    });
    await waitFor(() => expect(screen.getByText("b ok")).toBeTruthy());
  });
});
