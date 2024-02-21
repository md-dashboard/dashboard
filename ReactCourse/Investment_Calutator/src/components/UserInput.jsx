export default function UserInput({ onChange, userInput }) {
  // const [calculatedResult, setCalculatedResult] = useState(null);

  // function handleInputChange(e) {
  //   const { name, value } = e.target;
  //   setInvestment({
  //     ...investment,
  //     [name]: value,
  //   });
  // }
  // useEffect(() => {
  //   // Guard clause: if any input field is empty, return
  //   if (
  //     !investment.initialInvestment ||
  //     !investment.annualInvestment ||
  //     !investment.expectedReturn ||
  //     !investment.duration
  //   ) {
  //     return;
  //   }

  //   // Calculate investment results whenever investment state changes
  //   const calculated = calculateInvestmentResults(investment);
  //   onCalculate(calculated);
  // }, [investment, onCalculate]);

  // const { initialInvestment, annualInvestment, expectedReturn, duration } =
  //   investment;

  return (
    <section id="user-input">
      <div className="input-group">
        <p>
          <label>Initial Investment</label>
          <input
            type="number"
            name="initialInvestment"
            value={userInput.initialInvestment}
            onChange={(event) =>
              onChange("initialInvestment", event.target.value)
            }
            min={0}
          />
        </p>
        <p>
          <label>Annual Investment</label>
          <input
            type="number"
            name="annualInvestment"
            value={userInput.annualInvestment}
            onChange={(event) =>
              onChange("annualInvestment", event.target.value)
            }
            min={0}
          />
        </p>
        <p>
          <label>Expected Return</label>
          <input
            type="number"
            name="expectedReturn"
            value={userInput.expectedReturn}
            onChange={(event) => onChange("expectedReturn", event.target.value)}
            min={0}
          />
        </p>
        <p>
          <label>Duration</label>
          <input
            type="number"
            name="duration"
            value={userInput.duration}
            onChange={(event) => onChange("duration", event.target.value)}
            min={0}
          />
        </p>
      </div>
    </section>
  );
}
