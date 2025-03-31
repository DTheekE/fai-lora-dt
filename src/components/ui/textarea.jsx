export function Textarea(props) {
  return (
    <textarea {...props} className={`p-2 rounded-lg w-full ${props.className}`} />
  )
}
