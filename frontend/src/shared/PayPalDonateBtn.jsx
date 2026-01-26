import ReactGA from "react-ga4";

const PayPalDonateBtn = () => {
  return (
    <form
      action="https://www.paypal.com/donate"
      method="post"
      target="_top"
      onClick={() => ReactGA.event({ category: "Donation", action: "Click" })}
    >
      <input type="hidden" name="business" value="7AY7WF3G8SVHY" />
      <input type="hidden" name="no_recurring" value="0" />
      <input
        type="hidden"
        name="item_name"
        value="Ti piace il progetto VHF e Superiori? Se vuoi, puoi aiutarci a sostenerne i costi di gestione con una libera donazione. Grazie!"
      />
      <input type="hidden" name="currency_code" value="EUR" />
      <input
        type="image"
        src="https://www.paypalobjects.com/it_IT/IT/i/btn/btn_donate_LG.gif"
        border="0"
        name="submit"
        title="Aiutaci a sostenere VHF e Superiori!"
        alt="Fai una donazione con il pulsante PayPal"
      />
      <img
        alt=""
        border="0"
        src="https://www.paypal.com/it_IT/i/scr/pixel.gif"
        width="1"
        height="1"
      />
    </form>
  );
};

export default PayPalDonateBtn;
