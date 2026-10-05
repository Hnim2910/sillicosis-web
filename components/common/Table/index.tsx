import type { ReactNode } from "react";

export function Table({
  headers,
  children,
  caption,
}: {
  headers: string[];
  children: ReactNode;
  caption: string;
}) {
  return (
    <div className="table-scroll">
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
