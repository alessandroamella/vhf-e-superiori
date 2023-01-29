import React from "react";

const Regolamento = ({ event, ...props }) => {
  return (
    <div
      {...props}
      className="p-4 h-full min-h-[24rem] flex flex-col md:flex-row justify-center items-center"
    >
      <p className="text-center tracking-tight text-5xl font-bold text-blue-500">
        Regolamento
      </p>

      <div>
        Lorem ipsum, dolor sit amet consectetur adipisicing elit. Aliquid ipsum
        necessitatibus itaque doloremque reiciendis odit placeat? Quidem beatae
        adipisci corporis placeat nihil, aliquam esse fugiat dignissimos hic
        ducimus temporibus dolores?
      </div>
    </div>
  );
};

export default Regolamento;
