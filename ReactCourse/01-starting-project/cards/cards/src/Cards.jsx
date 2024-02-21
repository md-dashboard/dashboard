export default function Card({ name, children, mailto }) {
  return (
    <div>
      <p>{children}</p>
      <p>
        <a href={`mailto:${mailto}`}>email {name}</a>
      </p>
    </div>
  );
}
