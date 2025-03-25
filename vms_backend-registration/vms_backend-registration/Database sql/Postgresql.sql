--
-- PostgreSQL database dump
--

-- Dumped from database version 16.1
-- Dumped by pg_dump version 16.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: camera; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.camera (
    camera_id integer NOT NULL,
    status_name character varying(50),
    model_name character varying(50),
    camera_name character varying(100),
    location character varying(255),
    created_by character varying(50),
    updated_by character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    camera_type character varying,
    username character varying(50),
    password character varying
);


ALTER TABLE public.camera OWNER TO postgres;

--
-- Name: camera_camera_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.camera_camera_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.camera_camera_id_seq OWNER TO postgres;

--
-- Name: camera_camera_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.camera_camera_id_seq OWNED BY public.camera.camera_id;


--
-- Name: camera_ip; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.camera_ip (
    camera_id integer,
    camera_ip_address character varying(255),
    protocol character varying(10),
    serial_number character varying(50),
    camera_ip_id integer NOT NULL,
    channel character varying(255),
    port character varying(255),
    is_deleted boolean DEFAULT false,
    created_by character varying,
    updated_by character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone
);


ALTER TABLE public.camera_ip OWNER TO postgres;

--
-- Name: camera_ip_camera_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.camera_ip_camera_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.camera_ip_camera_id_seq OWNER TO postgres;

--
-- Name: camera_ip_camera_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.camera_ip_camera_id_seq OWNED BY public.camera_ip.camera_id;


--
-- Name: camera_ip_camera_ip_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.camera_ip_camera_ip_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.camera_ip_camera_ip_id_seq OWNER TO postgres;

--
-- Name: camera_ip_camera_ip_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.camera_ip_camera_ip_id_seq OWNED BY public.camera_ip.camera_ip_id;


--
-- Name: camera_model; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.camera_model (
    model_name character varying(50),
    created_by character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.camera_model OWNER TO postgres;

--
-- Name: camera_recording; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.camera_recording (
    camera_recording_id integer NOT NULL,
    camera_id integer,
    file_path text,
    created_by character varying(100),
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    is_deleted boolean DEFAULT false,
    camera_type character varying NOT NULL,
    created_at time without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.camera_recording OWNER TO postgres;

--
-- Name: camera_recording_camera_recording_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.camera_recording_camera_recording_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.camera_recording_camera_recording_id_seq OWNER TO postgres;

--
-- Name: camera_recording_camera_recording_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.camera_recording_camera_recording_id_seq OWNED BY public.camera_recording.camera_recording_id;


--
-- Name: camera_recording_schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.camera_recording_schedule (
    camera_id integer NOT NULL,
    camera_type character varying NOT NULL,
    file_path text,
    created_by character varying,
    camera_recording_schedule_id integer NOT NULL,
    start_datetime timestamp without time zone,
    end_datetime timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.camera_recording_schedule OWNER TO postgres;

--
-- Name: TABLE camera_recording_schedule; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.camera_recording_schedule IS 'nextval(''camera_recording_schedule_camera_recording_schedule_id_seq''::regclass)';


--
-- Name: camera_recording_schedule_camera_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.camera_recording_schedule_camera_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.camera_recording_schedule_camera_id_seq OWNER TO postgres;

--
-- Name: camera_recording_schedule_camera_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.camera_recording_schedule_camera_id_seq OWNED BY public.camera_recording_schedule.camera_id;


--
-- Name: camera_recording_schedule_camera_recording_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.camera_recording_schedule_camera_recording_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.camera_recording_schedule_camera_recording_schedule_id_seq OWNER TO postgres;

--
-- Name: camera_recording_schedule_camera_recording_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.camera_recording_schedule_camera_recording_schedule_id_seq OWNED BY public.camera_recording_schedule.camera_recording_schedule_id;


--
-- Name: camera_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.camera_types (
    camera_type character varying(50) NOT NULL,
    created_by character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.camera_types OWNER TO postgres;

--
-- Name: camera_usb; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.camera_usb (
    camera_id integer NOT NULL,
    is_deleted boolean DEFAULT false,
    created_by character varying,
    updated_by character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone
);


ALTER TABLE public.camera_usb OWNER TO postgres;

--
-- Name: camera_usb_camera_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.camera_usb_camera_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.camera_usb_camera_id_seq OWNER TO postgres;

--
-- Name: camera_usb_camera_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.camera_usb_camera_id_seq OWNED BY public.camera_usb.camera_id;


--
-- Name: camera_web; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.camera_web (
    camera_id integer NOT NULL,
    is_deleted boolean DEFAULT false,
    created_by character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying,
    updated_at timestamp without time zone
);


ALTER TABLE public.camera_web OWNER TO postgres;

--
-- Name: camera_web_camera_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.camera_web_camera_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.camera_web_camera_id_seq OWNER TO postgres;

--
-- Name: camera_web_camera_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.camera_web_camera_id_seq OWNED BY public.camera_web.camera_id;


--
-- Name: channels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.channels (
    channel character varying(255) NOT NULL,
    created_by character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.channels OWNER TO postgres;

--
-- Name: locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.locations (
    location character varying(255) NOT NULL,
    created_by character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.locations OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    permission_name character varying(50) NOT NULL,
    created_by character varying(50),
    updated_by character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_deleted boolean,
    permission_title character varying(100)
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: protocols; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.protocols (
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_deleted boolean DEFAULT false,
    protocol character varying(255) NOT NULL
);


ALTER TABLE public.protocols OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_name character varying(50) NOT NULL,
    created_by character varying(50),
    updated_by character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean,
    is_deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles_permissions (
    role_name character varying(50) NOT NULL,
    created_by character varying(50),
    updated_by character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_deleted boolean DEFAULT false,
    permission_name character varying(255) NOT NULL
);


ALTER TABLE public.roles_permissions OWNER TO postgres;

--
-- Name: status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.status (
    status_name character varying(50) NOT NULL
);


ALTER TABLE public.status OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    email character varying(255) NOT NULL,
    first_name character varying(50),
    last_name character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    dob date,
    updated_by character varying(50),
    last_login_time timestamp without time zone,
    last_logout_time timestamp without time zone,
    password character varying(255),
    is_active boolean,
    is_deleted boolean,
    mobile character varying(255),
    reset_token character varying(255)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_roles (
    email character varying(255) NOT NULL,
    role_name character varying(50) NOT NULL,
    created_by character varying(50),
    updated_by character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.users_roles OWNER TO postgres;

--
-- Name: camera camera_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera ALTER COLUMN camera_id SET DEFAULT nextval('public.camera_camera_id_seq'::regclass);


--
-- Name: camera_ip camera_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_ip ALTER COLUMN camera_id SET DEFAULT nextval('public.camera_ip_camera_id_seq'::regclass);


--
-- Name: camera_ip camera_ip_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_ip ALTER COLUMN camera_ip_id SET DEFAULT nextval('public.camera_ip_camera_ip_id_seq'::regclass);


--
-- Name: camera_recording camera_recording_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_recording ALTER COLUMN camera_recording_id SET DEFAULT nextval('public.camera_recording_camera_recording_id_seq'::regclass);


--
-- Name: camera_recording_schedule camera_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_recording_schedule ALTER COLUMN camera_id SET DEFAULT nextval('public.camera_recording_schedule_camera_id_seq'::regclass);


--
-- Name: camera_recording_schedule camera_recording_schedule_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_recording_schedule ALTER COLUMN camera_recording_schedule_id SET DEFAULT nextval('public.camera_recording_schedule_camera_recording_schedule_id_seq'::regclass);


--
-- Name: camera_usb camera_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_usb ALTER COLUMN camera_id SET DEFAULT nextval('public.camera_usb_camera_id_seq'::regclass);


--
-- Name: camera_web camera_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_web ALTER COLUMN camera_id SET DEFAULT nextval('public.camera_web_camera_id_seq'::regclass);


--
-- Name: camera_ip camera_ip_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_ip
    ADD CONSTRAINT camera_ip_pkey PRIMARY KEY (camera_ip_id);


--
-- Name: camera_model camera_model_model_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_model
    ADD CONSTRAINT camera_model_model_name_key UNIQUE (model_name);


--
-- Name: camera camera_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera
    ADD CONSTRAINT camera_pkey PRIMARY KEY (camera_id);


--
-- Name: camera_recording camera_recording_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_recording
    ADD CONSTRAINT camera_recording_pkey PRIMARY KEY (camera_recording_id);


--
-- Name: camera_types camera_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_types
    ADD CONSTRAINT camera_types_pkey PRIMARY KEY (camera_type);


--
-- Name: channels channel; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channel PRIMARY KEY (channel);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (location);


--
-- Name: permissions permission_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permission_name PRIMARY KEY (permission_name);


--
-- Name: camera_recording_schedule pk_camera_recording_schedule_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_recording_schedule
    ADD CONSTRAINT pk_camera_recording_schedule_id PRIMARY KEY (camera_recording_schedule_id);


--
-- Name: protocols protocols_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocols
    ADD CONSTRAINT protocols_pkey PRIMARY KEY (protocol);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_name);


--
-- Name: status status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status
    ADD CONSTRAINT status_pkey PRIMARY KEY (status_name);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (email);


--
-- Name: camera_ip camera_ip_camera_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_ip
    ADD CONSTRAINT camera_ip_camera_id_fkey FOREIGN KEY (camera_id) REFERENCES public.camera(camera_id);


--
-- Name: camera camera_model_name_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera
    ADD CONSTRAINT camera_model_name_fkey FOREIGN KEY (model_name) REFERENCES public.camera_model(model_name);


--
-- Name: camera_recording camera_recording_camera_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_recording
    ADD CONSTRAINT camera_recording_camera_id_fkey FOREIGN KEY (camera_id) REFERENCES public.camera(camera_id);


--
-- Name: camera_recording_schedule camera_recording_schedule_camera_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_recording_schedule
    ADD CONSTRAINT camera_recording_schedule_camera_id_fkey FOREIGN KEY (camera_id) REFERENCES public.camera(camera_id);


--
-- Name: camera camera_status_name_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera
    ADD CONSTRAINT camera_status_name_fkey FOREIGN KEY (status_name) REFERENCES public.status(status_name);


--
-- Name: camera_recording camera_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_recording
    ADD CONSTRAINT camera_type FOREIGN KEY (camera_type) REFERENCES public.camera_types(camera_type) NOT VALID;


--
-- Name: camera_recording_schedule camera_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_recording_schedule
    ADD CONSTRAINT camera_type FOREIGN KEY (camera_type) REFERENCES public.camera_types(camera_type) NOT VALID;


--
-- Name: camera_usb camera_usb_camera_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_usb
    ADD CONSTRAINT camera_usb_camera_id_fkey FOREIGN KEY (camera_id) REFERENCES public.camera(camera_id);


--
-- Name: camera_web camera_web_camera_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_web
    ADD CONSTRAINT camera_web_camera_id_fkey FOREIGN KEY (camera_id) REFERENCES public.camera(camera_id);


--
-- Name: camera_ip fk_camera_ip_channel; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera_ip
    ADD CONSTRAINT fk_camera_ip_channel FOREIGN KEY (channel) REFERENCES public.channels(channel) ON DELETE CASCADE;


--
-- Name: roles_permissions roles_permissions_permission_name_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permissions
    ADD CONSTRAINT roles_permissions_permission_name_fkey FOREIGN KEY (permission_name) REFERENCES public.permissions(permission_name) NOT VALID;


--
-- PostgreSQL database dump complete
--

