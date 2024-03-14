import { Link, useNavigate } from "react-router-dom";
import Flags from "./Flags";
import { Button, Tooltip } from "flowbite-react";
import { LazyLoadImage } from "react-lazy-load-image-component";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-lightGray-normal dark:bg-gray-800 dark:text-white py-4 px-2 md:px-8 flex flex-col lg:flex-row md:items-center gap-4">
      <Link
        to="/"
        className="flex gap-2 items-center hover:scale-105 transition-transform w-fit"
      >
        <LazyLoadImage
          className="w-20 md:w-36"
          src="/logo-min.png"
          alt="Logo"
        />
        <h1 className="font-bold text-xl md:text-3xl block text-red-500 dark:text-white">
          www.vhfesuperiori.eu
        </h1>
      </Link>
      <div className="hidden md:block">
        <Flags />
      </div>
      <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 md:justify-center md:w-full">
        <div className="mt-2 scale-110">
          <form
            action="https://www.paypal.com/donate"
            method="post"
            target="_top"
          >
            <input type="hidden" name="business" value="7AY7WF3G8SVHY" />
            <input type="hidden" name="no_recurring" value="0" />
            <input
              type="hidden"
              name="item_name"
              value="Aiutaci a sostenere Vhfesuperiori, stiamo facendo il massimo per offrirti un servizio migliore. Grazie!"
            />
            <input type="hidden" name="currency_code" value="EUR" />
            <input
              type="image"
              src="https://www.paypalobjects.com/it_IT/IT/i/btn/btn_donate_LG.gif"
              border="0"
              name="submit"
              title="Aiutaci a sostenere VHF e superiori!"
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
        </div>
        <div>
          <Button className="uppercase" onClick={() => navigate("/social")}>
            Foto / video
          </Button>
        </div>
        <div>
          <Tooltip content="In arrivo a breve">
            <Button
              color="purple"
              className="uppercase"
              disabled
              onClick={() => navigate("/beacon")}
            >
              Beacon
            </Button>
          </Tooltip>
        </div>
      </div>
    </header>
  );
};

export default Header;
