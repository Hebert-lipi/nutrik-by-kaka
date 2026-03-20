export function EmptyTableRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10">
        <p className="text-center text-body14 text-text-secondary">{message}</p>
      </td>
    </tr>
  );
}

