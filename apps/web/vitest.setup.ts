import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Desmonta os componentes entre testes (sem globals, a limpeza automática não é registrada).
afterEach(cleanup);
