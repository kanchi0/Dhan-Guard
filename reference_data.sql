--
-- PostgreSQL database dump
--

\restrict buLgSjAesdc7oktGswdCJlPRl88eG4tDQobazIQZvbO54j9a9kLVhXgUV2PRGr7

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: diseases; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.diseases (id, name, description, symptoms, cause) VALUES (1, 'Bacterial Leaf Blight', 'A bacterial disease that dries out leaves and can reduce yield.', 'Water-soaked to yellowish stripes start at leaf tips and edges, then turn straw-colored and dry. In severe cases whole leaves wither.', 'Bacterium Xanthomonas oryzae pv. oryzae. It spreads through infected seed, irrigation water, rain splash and wounds on leaves.');
INSERT INTO public.diseases (id, name, description, symptoms, cause) VALUES (2, 'Brown Spot', 'A fungal disease that causes spots on leaves and grains, often linked to poor soil nutrition.', 'Oval brown spots with a gray or whitish center and a yellow ring around them appear on leaves. Spots can also appear on grains.', 'Fungus Bipolaris oryzae. It is more common in nutrient-poor soil, water-stressed fields and when infected seed is used.');
INSERT INTO public.diseases (id, name, description, symptoms, cause) VALUES (3, 'Healthy Rice Leaf', 'No disease detected in this leaf image.', 'The leaf is uniformly green with no spots, stripes or insect damage.', 'Not applicable.');
INSERT INTO public.diseases (id, name, description, symptoms, cause) VALUES (4, 'Leaf Blast', 'One of the most damaging fungal diseases of rice.', 'Diamond or spindle-shaped lesions with a gray center and brown edges appear on leaves. Many lesions can join and dry the whole leaf.', 'Fungus Magnaporthe oryzae. It spreads by airborne spores and is favored by high humidity, cool nights and heavy nitrogen use.');
INSERT INTO public.diseases (id, name, description, symptoms, cause) VALUES (5, 'Leaf scald', 'A fungal disease that gives leaves a scalded, burnt look.', 'Lesions start at leaf tips or edges and spread inward with light and dark bands, so the leaf looks scalded.', 'Fungus Monographella albescens. It is favored by high humidity and high nitrogen levels.');
INSERT INTO public.diseases (id, name, description, symptoms, cause) VALUES (6, 'Narrow Brown Leaf Spot', 'A fungal disease that causes narrow brown lines on leaves.', 'Short, narrow, brown lines run parallel to the leaf veins. Severe infection can dry leaves and weaken the plant.', 'Fungus Cercospora janseana. It is more common when soil potassium is low and plants are stressed.');
INSERT INTO public.diseases (id, name, description, symptoms, cause) VALUES (7, 'Rice Hispa', 'An insect pest that damages leaves.', 'White or pale parallel streaks appear on the leaf surface where adults scrape the green tissue. Larvae tunnel inside leaves, which then dry out.', 'Insect pest Dicladispa armigera (rice hispa beetle). It is not caused by a germ. It is more common in weedy fields and with heavy nitrogen use.');
INSERT INTO public.diseases (id, name, description, symptoms, cause) VALUES (8, 'Sheath Blight', 'A fungal disease that attacks the leaf sheath near the water line.', 'Oval greenish-gray lesions with brown borders appear on the sheath near the water level and spread upward to the leaves.', 'Fungus Rhizoctonia solani. It is favored by dense planting, high humidity and heavy nitrogen use. It survives in the soil as hard bodies called sclerotia.');


--
-- Data for Name: treatments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.treatments (id, disease_id, type, recommendation) VALUES (1, 1, 'preventive', 'Use resistant or tolerant varieties and clean, healthy seed. Avoid excess nitrogen fertilizer, keep fields weed-free and remove infected stubble after harvest.');
INSERT INTO public.treatments (id, disease_id, type, recommendation) VALUES (2, 1, 'chemical', 'Chemical control is limited for this disease. Ask a local agricultural officer (DAE) whether any approved product is recommended for your area.');
INSERT INTO public.treatments (id, disease_id, type, recommendation) VALUES (3, 2, 'preventive', 'Use healthy seed, apply balanced fertilizer (including potassium) and avoid water stress in the field.');
INSERT INTO public.treatments (id, disease_id, type, recommendation) VALUES (4, 2, 'chemical', 'If the disease is severe, ask a local agricultural officer (DAE) which fungicide is recommended and follow the label instructions.');
INSERT INTO public.treatments (id, disease_id, type, recommendation) VALUES (5, 3, 'preventive', 'Keep up good practice: balanced fertilizer, proper water management, clean fields and regular scouting for early signs of disease or pests.');
INSERT INTO public.treatments (id, disease_id, type, recommendation) VALUES (6, 4, 'preventive', 'Use resistant varieties and healthy seed, avoid excess nitrogen, keep proper plant spacing and remove infected plant residue.');
INSERT INTO public.treatments (id, disease_id, type, recommendation) VALUES (7, 4, 'chemical', 'Early treatment matters. Ask a local agricultural officer (DAE) for the recommended fungicide and timing, and follow the label instructions.');
INSERT INTO public.treatments (id, disease_id, type, recommendation) VALUES (8, 5, 'preventive', 'Use healthy seed, avoid excess nitrogen, keep plant spacing open and remove infected residue after harvest.');
INSERT INTO public.treatments (id, disease_id, type, recommendation) VALUES (9, 6, 'preventive', 'Apply balanced fertilizer including potassium, use resistant varieties where available and remove infected residue.');
INSERT INTO public.treatments (id, disease_id, type, recommendation) VALUES (10, 6, 'chemical', 'If severe, ask a local agricultural officer (DAE) about a recommended fungicide and follow the label instructions.');
INSERT INTO public.treatments (id, disease_id, type, recommendation) VALUES (11, 7, 'preventive', 'Keep fields and bunds free of weeds, avoid excess nitrogen and clip leaf tips of seedlings before transplanting.');
INSERT INTO public.treatments (id, disease_id, type, recommendation) VALUES (12, 7, 'organic', 'Collect adult beetles by hand or with a net in small fields, and remove heavily damaged leaves.');
INSERT INTO public.treatments (id, disease_id, type, recommendation) VALUES (13, 7, 'chemical', 'For heavy infestation, ask a local agricultural officer (DAE) which insecticide is recommended and follow the label instructions.');
INSERT INTO public.treatments (id, disease_id, type, recommendation) VALUES (14, 8, 'preventive', 'Use wider spacing, avoid excess nitrogen, keep fields weed-free and remove floating debris and infected stubble.');
INSERT INTO public.treatments (id, disease_id, type, recommendation) VALUES (15, 8, 'chemical', 'If the disease is spreading, ask a local agricultural officer (DAE) which fungicide is recommended and follow the label instructions.');


--
-- Name: diseases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.diseases_id_seq', 8, true);


--
-- Name: treatments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.treatments_id_seq', 15, true);


--
-- PostgreSQL database dump complete
--

\unrestrict buLgSjAesdc7oktGswdCJlPRl88eG4tDQobazIQZvbO54j9a9kLVhXgUV2PRGr7

