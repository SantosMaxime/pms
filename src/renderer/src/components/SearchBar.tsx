import { useState, FormEvent } from 'react'

type Props = {
  placeholder?: string
  onSearch?: (value: string) => void
}

function SearchBar({ placeholder = 'Search...', onSearch }: Props): React.JSX.Element {
  const [value, setValue] = useState('')

  function handleSubmit(e: FormEvent): void {
    e.preventDefault()
    onSearch?.(value)
  }

  function handleChange(newValue: string): void {
    setValue(newValue)
    // Trigger search on every keystroke for real-time filtering
    onSearch?.(newValue)
  }

  function handleClear(): void {
    setValue('')
    onSearch?.('')
  }

  return (
    <form className="searchbar" role="search" onSubmit={handleSubmit} aria-label="Site search">
      <button type="submit" className="searchbar-btn" aria-label="Search">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M21 21l-4.35-4.35"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="11"
            cy="11"
            r="6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <input
        className="searchbar-input"
        type="text"
        inputMode="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Search input"
      />

      {value && (
        <button
          type="button"
          className="searchbar-btn"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </form>
  )
}

export default SearchBar
