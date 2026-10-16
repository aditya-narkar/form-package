import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useField, useForm } from "../src";

interface Values {
  username: string;
}

function UsernameForm({ validate }: { validate: (value: string) => Promise<string | undefined> }) {
  const form = useForm<Values>({ mode: "onChange" });
  const username = useField(form.control, "username");

  return (
    <form>
      <input
        aria-label="username"
        {...form.register("username", {
          debounceMs: 0,
          validate
        })}
      />
      <span>{username.isValidating ? "checking" : username.error?.message}</span>
    </form>
  );
}

describe("async validation races", () => {
  it("does not let stale async validation overwrite the latest result", async () => {
    vi.useFakeTimers();
    const validate = vi.fn((value: string) => {
      const delay = value === "abc" ? 100 : 10;
      return new Promise<string | undefined>((resolve) => {
        setTimeout(() => resolve(value === "abc" ? "Taken" : undefined), delay);
      });
    });

    render(<UsernameForm validate={validate} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText("username"), { target: { value: "abc" } });
      fireEvent.change(screen.getByLabelText("username"), { target: { value: "abcd" } });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(screen.queryByText("Taken")).toBeNull();
    vi.useRealTimers();
  });
});
