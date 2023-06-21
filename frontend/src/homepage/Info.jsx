import { Timeline } from "flowbite-react";
import React from "react";
import { FaAngleDoubleRight } from "react-icons/fa";
import Layout from "../Layout";
import { LazyLoadImage } from "react-lazy-load-image-component";

export const adminsList = [
  "IZ5RNF Ronca Alessandro",
  "IZ5IOQ Metteucci Giacomo",
  "IK7UXU Ingrosso Flavio",
  "IZ2MHO Pinzelli Bruno",
  "IT9DJF Casini Andrea",
  "IU0NWJ Peruzzi Cristiano",
  "IU4JJJ Cerrone Pietro",
  "EA5ZJ Jorge Alfonso Martinez"
];

const Info = ({ event, ...props }) => {
  return (
    <Layout>
      <div
        {...props}
        className="p-4 h-full flex flex-col justify-center items-center"
      >
        <p className="mt-4 md:mt-8 text-center tracking-tight text-5xl font-bold text-blue-500">
          Informazioni
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 mt-4 md:mt-12">
          <LazyLoadImage
            src="/logo-min.png"
            alt="Logo"
            className="w-full max-w-sm mx-auto"
          />
          <Timeline>
            <Timeline.Item>
              <Timeline.Point />
              <Timeline.Content>
                <Timeline.Time>February 2022</Timeline.Time>
                <Timeline.Title>
                  Application UI code in Tailwind CSS
                </Timeline.Title>
                <Timeline.Body>
                  Get access to over 20+ pages including a dashboard layout,
                  charts, kanban board, calendar, and pre-order E-commerce &
                  Marketing pages.
                </Timeline.Body>
              </Timeline.Content>
            </Timeline.Item>
            <Timeline.Item>
              <Timeline.Point />
              <Timeline.Content>
                <Timeline.Time>March 2022</Timeline.Time>
                <Timeline.Title>Marketing UI design in Figma</Timeline.Title>
                <Timeline.Body>
                  All of the pages and components are first designed in Figma
                  and we keep a parity between the two versions even as we
                  update the project.
                </Timeline.Body>
              </Timeline.Content>
            </Timeline.Item>
            <Timeline.Item>
              <Timeline.Point />
              <Timeline.Content>
                <Timeline.Time>April 2022</Timeline.Time>
                <Timeline.Title>
                  E-Commerce UI code in Tailwind CSS
                </Timeline.Title>
                <Timeline.Body>
                  Get started with dozens of web components and interactive
                  elements built on top of Tailwind CSS.
                </Timeline.Body>
              </Timeline.Content>
            </Timeline.Item>
          </Timeline>
        </div>

        <p className="mt-12 md:mt-20 text-center tracking-tight text-5xl font-bold text-blue-500">
          Amministratori
        </p>

        <div className="mt-4">
          {adminsList.map(e => (
            <a
              href={"https://www.qrz.com/db/" + e.split(" ")[0]}
              target="_blank"
              rel="noopener noreferrer"
              key={e}
              className="flex items-center underline decoration-dotted"
            >
              <span className="text-gray-500 font-bold text-3xl">
                <FaAngleDoubleRight />
              </span>
              <span className="ml-1">{e}</span>
            </a>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Info;
