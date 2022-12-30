import Layout from "../Layout";
import EventPreview from "./EventPreview";
import { Carousel } from "react-responsive-carousel";

/**
 * @typedef {Object} Event
 * @property {string} name
 * @property {string} description
 * @property {Date} date
 * @property {Date} joinDeadline
 * @property {string} logoUrl
 */

/** @type {Array.<Event>} */
const events = [
    {
        name: "prova 2",
        description: "lorem ipsum dolor sit amet andrea dura",
        date: new Date("2023/02/01 10:00"),
        joinDeadline: new Date("2023/01/15 10:00"),
        logoUrl: "https://picsum.photos/600"
    },
    {
        name: "prova 2",
        description: "lorem ipsum dolor sit amet andrea dura",
        date: new Date("2023/02/01 10:00"),
        joinDeadline: new Date("2023/01/15 10:00"),
        logoUrl: "https://picsum.photos/500"
    }
];

const Homepage = () => {
    return (
        <Layout>
            <div className="p-3 md:p-6">
                <h1 className="font-bold text-4xl tracking-tight uppercase mt-4 mb-8 text-center">
                    Prossimi eventi
                </h1>

                <Carousel autoPlay centerMode emulateTouch infiniteLoop>
                    {events.map((e, i) => (
                        <EventPreview event={e} key={i} />
                    ))}
                </Carousel>
            </div>
        </Layout>
    );
};

export default Homepage;
