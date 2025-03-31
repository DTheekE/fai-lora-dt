export function Input(props) {
  return (
    <input {...props} className={`p-2 rounded-lg w-full ${props.className}`} />
  )
}
