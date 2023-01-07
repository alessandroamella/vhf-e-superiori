import Layout from "../Layout";
import EventPreview from "./EventPreview";
import { Carousel } from "react-responsive-carousel";
import { Typography } from "@material-tailwind/react";
import { useState, useEffect } from "react";
import axios from "axios";

// import StarSky from "react-star-sky";
// import "react-star-sky/dist/index.css";

const Homepage = () => {
    const [events, setEvents] = useState([
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
        },
        {
            name: "bio ghane",
            description: "lorem ipsum dolor sit amet andrea dura",
            date: new Date("2023/02/01 10:00"),
            joinDeadline: new Date("2023/01/15 10:00"),
            logoUrl: "https://picsum.photos/500"
        }
    ]);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const { data } = await axios.get("/api/events");
                setEvents(data);
            } catch (err) {}
        }
    }, []);

    return (
        <Layout>
            {/* <StarSky /> */}
            <div className="p-3 md:p-6">
                <Typography variant="h2" className="mb-8">
                    Prossimi eventi
                </Typography>

                <Carousel
                    showThumbs={false}
                    autoPlay
                    centerMode
                    emulateTouch
                    infiniteLoop
                >
                    {events.map((e, i) => (
                        <EventPreview event={e} key={i} />
                    ))}
                </Carousel>
            </div>
        </Layout>
    );
};

export default Homepage;
