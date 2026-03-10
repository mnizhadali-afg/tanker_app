import { useCallback, useRef } from 'react'

interface NavOptions {
  rowCount: number
  colCount: number
  onAddRow?: () => void
}

export function useKeyboardNav({ rowCount, colCount, onAddRow }: NavOptions) {
  const focusCell = useCallback((row: number, col: number) => {
    const el = document.querySelector<HTMLElement>(
      `[data-grid-row="${row}"][data-grid-col="${col}"]`,
    )
    el?.focus()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentRow: number, currentCol: number) => {
      switch (e.key) {
        case 'Tab': {
          e.preventDefault()
          if (e.shiftKey) {
            // Move backwards
            if (currentCol > 0) {
              focusCell(currentRow, currentCol - 1)
            } else if (currentRow > 0) {
              focusCell(currentRow - 1, colCount - 1)
            }
          } else {
            // Move forwards
            if (currentCol < colCount - 1) {
              focusCell(currentRow, currentCol + 1)
            } else if (currentRow < rowCount - 1) {
              focusCell(currentRow + 1, 0)
            } else {
              // At last cell of last row — add a new row
              onAddRow?.()
              setTimeout(() => focusCell(rowCount, 0), 50)
            }
          }
          break
        }
        case 'Enter': {
          e.preventDefault()
          if (currentRow < rowCount - 1) {
            focusCell(currentRow + 1, currentCol)
          } else {
            onAddRow?.()
            setTimeout(() => focusCell(rowCount, currentCol), 50)
          }
          break
        }
        case 'ArrowUp':
          if (currentRow > 0) { e.preventDefault(); focusCell(currentRow - 1, currentCol) }
          break
        case 'ArrowDown':
          if (currentRow < rowCount - 1) { e.preventDefault(); focusCell(currentRow + 1, currentCol) }
          break
        case 'ArrowLeft':
          if (currentCol > 0 && e.ctrlKey) { e.preventDefault(); focusCell(currentRow, currentCol - 1) }
          break
        case 'ArrowRight':
          if (currentCol < colCount - 1 && e.ctrlKey) { e.preventDefault(); focusCell(currentRow, currentCol + 1) }
          break
      }
    },
    [focusCell, rowCount, colCount, onAddRow],
  )

  return { handleKeyDown }
}

export function usePasteHandler(
  onPaste: (tsv: string, colIndex: number) => void,
) {
  const focusedColRef = useRef(0)

  const handleCellFocus = useCallback((colIndex: number) => {
    focusedColRef.current = colIndex
  }, [])

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain')
      if (!text) return
      // Only intercept pastes that look like multi-cell TSV (contain tab or newline)
      if (!text.includes('\t') && !text.includes('\n')) return
      e.preventDefault()
      onPaste(text, focusedColRef.current)
    },
    [onPaste],
  )

  return { handleCellFocus, handlePaste }
}
