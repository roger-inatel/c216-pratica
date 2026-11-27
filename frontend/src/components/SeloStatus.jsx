import { STATUS } from "../status";

export function SeloStatus({ status }) {
  const { rotulo, cor } = STATUS[status];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cor}`}>
      {rotulo}
    </span>
  );
}
