const URL_REGEX = /(https?:\/\/[^\s<]+)/g

export function Linkify({ children }: { children: string }) {
  const parts = children.split(URL_REGEX)
  return (
    <>
      {parts.map((part, i) =>
        URL_REGEX.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f8571f] underline hover:opacity-80 break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}
