--
-- PostgreSQL database dump
--

\restrict pJUYV6RFhgr3hYr4gArMdd8VnElfFM8WyrKO7r1BcY5JiY6hV7ReSA8cEm79SuI

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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
-- Name: categories; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(255)
);


ALTER TABLE public.categories OWNER TO directus;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO directus;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: directus_access; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_access (
    id uuid NOT NULL,
    role uuid,
    "user" uuid,
    policy uuid NOT NULL,
    sort integer
);


ALTER TABLE public.directus_access OWNER TO directus;

--
-- Name: directus_activity; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_activity (
    id integer NOT NULL,
    action character varying(45) NOT NULL,
    "user" uuid,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip character varying(50),
    user_agent text,
    collection character varying(64) NOT NULL,
    item character varying(255) NOT NULL,
    origin character varying(255)
);


ALTER TABLE public.directus_activity OWNER TO directus;

--
-- Name: directus_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.directus_activity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_activity_id_seq OWNER TO directus;

--
-- Name: directus_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.directus_activity_id_seq OWNED BY public.directus_activity.id;


--
-- Name: directus_collections; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_collections (
    collection character varying(64) NOT NULL,
    icon character varying(64),
    note text,
    display_template character varying(255),
    hidden boolean DEFAULT false NOT NULL,
    singleton boolean DEFAULT false NOT NULL,
    translations json,
    archive_field character varying(64),
    archive_app_filter boolean DEFAULT true NOT NULL,
    archive_value character varying(255),
    unarchive_value character varying(255),
    sort_field character varying(64),
    accountability character varying(255) DEFAULT 'all'::character varying,
    color character varying(255),
    item_duplication_fields json,
    sort integer,
    "group" character varying(64),
    collapse character varying(255) DEFAULT 'open'::character varying NOT NULL,
    preview_url character varying(255),
    versioning boolean DEFAULT false NOT NULL
);


ALTER TABLE public.directus_collections OWNER TO directus;

--
-- Name: directus_comments; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_comments (
    id uuid NOT NULL,
    collection character varying(64) NOT NULL,
    item character varying(255) NOT NULL,
    comment text NOT NULL,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    date_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid,
    user_updated uuid
);


ALTER TABLE public.directus_comments OWNER TO directus;

--
-- Name: directus_dashboards; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_dashboards (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    icon character varying(64) DEFAULT 'dashboard'::character varying NOT NULL,
    note text,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid,
    color character varying(255)
);


ALTER TABLE public.directus_dashboards OWNER TO directus;

--
-- Name: directus_extensions; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_extensions (
    enabled boolean DEFAULT true NOT NULL,
    id uuid NOT NULL,
    folder character varying(255) NOT NULL,
    source character varying(255) NOT NULL,
    bundle uuid
);


ALTER TABLE public.directus_extensions OWNER TO directus;

--
-- Name: directus_fields; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_fields (
    id integer NOT NULL,
    collection character varying(64) NOT NULL,
    field character varying(64) NOT NULL,
    special character varying(64),
    interface character varying(64),
    options json,
    display character varying(64),
    display_options json,
    readonly boolean DEFAULT false NOT NULL,
    hidden boolean DEFAULT false NOT NULL,
    sort integer,
    width character varying(30) DEFAULT 'full'::character varying,
    translations json,
    note text,
    conditions json,
    required boolean DEFAULT false,
    "group" character varying(64),
    validation json,
    validation_message text
);


ALTER TABLE public.directus_fields OWNER TO directus;

--
-- Name: directus_fields_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.directus_fields_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_fields_id_seq OWNER TO directus;

--
-- Name: directus_fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.directus_fields_id_seq OWNED BY public.directus_fields.id;


--
-- Name: directus_files; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_files (
    id uuid NOT NULL,
    storage character varying(255) NOT NULL,
    filename_disk character varying(255),
    filename_download character varying(255) NOT NULL,
    title character varying(255),
    type character varying(255),
    folder uuid,
    uploaded_by uuid,
    created_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    modified_by uuid,
    modified_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    charset character varying(50),
    filesize bigint,
    width integer,
    height integer,
    duration integer,
    embed character varying(200),
    description text,
    location text,
    tags text,
    metadata json,
    focal_point_x integer,
    focal_point_y integer,
    tus_id character varying(64),
    tus_data json,
    uploaded_on timestamp with time zone
);


ALTER TABLE public.directus_files OWNER TO directus;

--
-- Name: directus_flows; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_flows (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    icon character varying(64),
    color character varying(255),
    description text,
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    trigger character varying(255),
    accountability character varying(255) DEFAULT 'all'::character varying,
    options json,
    operation uuid,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid
);


ALTER TABLE public.directus_flows OWNER TO directus;

--
-- Name: directus_folders; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_folders (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    parent uuid
);


ALTER TABLE public.directus_folders OWNER TO directus;

--
-- Name: directus_migrations; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_migrations (
    version character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.directus_migrations OWNER TO directus;

--
-- Name: directus_notifications; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_notifications (
    id integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(255) DEFAULT 'inbox'::character varying,
    recipient uuid NOT NULL,
    sender uuid,
    subject character varying(255) NOT NULL,
    message text,
    collection character varying(64),
    item character varying(255)
);


ALTER TABLE public.directus_notifications OWNER TO directus;

--
-- Name: directus_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.directus_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_notifications_id_seq OWNER TO directus;

--
-- Name: directus_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.directus_notifications_id_seq OWNED BY public.directus_notifications.id;


--
-- Name: directus_operations; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_operations (
    id uuid NOT NULL,
    name character varying(255),
    key character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    position_x integer NOT NULL,
    position_y integer NOT NULL,
    options json,
    resolve uuid,
    reject uuid,
    flow uuid NOT NULL,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid
);


ALTER TABLE public.directus_operations OWNER TO directus;

--
-- Name: directus_panels; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_panels (
    id uuid NOT NULL,
    dashboard uuid NOT NULL,
    name character varying(255),
    icon character varying(64) DEFAULT NULL::character varying,
    color character varying(10),
    show_header boolean DEFAULT false NOT NULL,
    note text,
    type character varying(255) NOT NULL,
    position_x integer NOT NULL,
    position_y integer NOT NULL,
    width integer NOT NULL,
    height integer NOT NULL,
    options json,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid
);


ALTER TABLE public.directus_panels OWNER TO directus;

--
-- Name: directus_permissions; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_permissions (
    id integer NOT NULL,
    collection character varying(64) NOT NULL,
    action character varying(10) NOT NULL,
    permissions json,
    validation json,
    presets json,
    fields text,
    policy uuid NOT NULL
);


ALTER TABLE public.directus_permissions OWNER TO directus;

--
-- Name: directus_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.directus_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_permissions_id_seq OWNER TO directus;

--
-- Name: directus_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.directus_permissions_id_seq OWNED BY public.directus_permissions.id;


--
-- Name: directus_policies; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_policies (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    icon character varying(64) DEFAULT 'badge'::character varying NOT NULL,
    description text,
    ip_access text,
    enforce_tfa boolean DEFAULT false NOT NULL,
    admin_access boolean DEFAULT false NOT NULL,
    app_access boolean DEFAULT false NOT NULL
);


ALTER TABLE public.directus_policies OWNER TO directus;

--
-- Name: directus_presets; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_presets (
    id integer NOT NULL,
    bookmark character varying(255),
    "user" uuid,
    role uuid,
    collection character varying(64),
    search character varying(100),
    layout character varying(100) DEFAULT 'tabular'::character varying,
    layout_query json,
    layout_options json,
    refresh_interval integer,
    filter json,
    icon character varying(64) DEFAULT 'bookmark'::character varying,
    color character varying(255)
);


ALTER TABLE public.directus_presets OWNER TO directus;

--
-- Name: directus_presets_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.directus_presets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_presets_id_seq OWNER TO directus;

--
-- Name: directus_presets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.directus_presets_id_seq OWNED BY public.directus_presets.id;


--
-- Name: directus_relations; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_relations (
    id integer NOT NULL,
    many_collection character varying(64) NOT NULL,
    many_field character varying(64) NOT NULL,
    one_collection character varying(64),
    one_field character varying(64),
    one_collection_field character varying(64),
    one_allowed_collections text,
    junction_field character varying(64),
    sort_field character varying(64),
    one_deselect_action character varying(255) DEFAULT 'nullify'::character varying NOT NULL
);


ALTER TABLE public.directus_relations OWNER TO directus;

--
-- Name: directus_relations_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.directus_relations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_relations_id_seq OWNER TO directus;

--
-- Name: directus_relations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.directus_relations_id_seq OWNED BY public.directus_relations.id;


--
-- Name: directus_revisions; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_revisions (
    id integer NOT NULL,
    activity integer NOT NULL,
    collection character varying(64) NOT NULL,
    item character varying(255) NOT NULL,
    data json,
    delta json,
    parent integer,
    version uuid
);


ALTER TABLE public.directus_revisions OWNER TO directus;

--
-- Name: directus_revisions_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.directus_revisions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_revisions_id_seq OWNER TO directus;

--
-- Name: directus_revisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.directus_revisions_id_seq OWNED BY public.directus_revisions.id;


--
-- Name: directus_roles; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_roles (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    icon character varying(64) DEFAULT 'supervised_user_circle'::character varying NOT NULL,
    description text,
    parent uuid
);


ALTER TABLE public.directus_roles OWNER TO directus;

--
-- Name: directus_sessions; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_sessions (
    token character varying(64) NOT NULL,
    "user" uuid,
    expires timestamp with time zone NOT NULL,
    ip character varying(255),
    user_agent text,
    share uuid,
    origin character varying(255),
    next_token character varying(64)
);


ALTER TABLE public.directus_sessions OWNER TO directus;

--
-- Name: directus_settings; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_settings (
    id integer NOT NULL,
    project_name character varying(100) DEFAULT 'Directus'::character varying NOT NULL,
    project_url character varying(255),
    project_color character varying(255) DEFAULT '#6644FF'::character varying NOT NULL,
    project_logo uuid,
    public_foreground uuid,
    public_background uuid,
    public_note text,
    auth_login_attempts integer DEFAULT 25,
    auth_password_policy character varying(100),
    storage_asset_transform character varying(7) DEFAULT 'all'::character varying,
    storage_asset_presets json,
    custom_css text,
    storage_default_folder uuid,
    basemaps json,
    mapbox_key character varying(255),
    module_bar json,
    project_descriptor character varying(100),
    default_language character varying(255) DEFAULT 'en-US'::character varying NOT NULL,
    custom_aspect_ratios json,
    public_favicon uuid,
    default_appearance character varying(255) DEFAULT 'auto'::character varying NOT NULL,
    default_theme_light character varying(255),
    theme_light_overrides json,
    default_theme_dark character varying(255),
    theme_dark_overrides json,
    report_error_url character varying(255),
    report_bug_url character varying(255),
    report_feature_url character varying(255),
    public_registration boolean DEFAULT false NOT NULL,
    public_registration_verify_email boolean DEFAULT true NOT NULL,
    public_registration_role uuid,
    public_registration_email_filter json,
    visual_editor_urls json,
    accepted_terms boolean DEFAULT false,
    project_id uuid,
    mcp_enabled boolean DEFAULT false NOT NULL,
    mcp_allow_deletes boolean DEFAULT false NOT NULL,
    mcp_prompts_collection character varying(255) DEFAULT NULL::character varying,
    mcp_system_prompt_enabled boolean DEFAULT true NOT NULL,
    mcp_system_prompt text
);


ALTER TABLE public.directus_settings OWNER TO directus;

--
-- Name: directus_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.directus_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_settings_id_seq OWNER TO directus;

--
-- Name: directus_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.directus_settings_id_seq OWNED BY public.directus_settings.id;


--
-- Name: directus_shares; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_shares (
    id uuid NOT NULL,
    name character varying(255),
    collection character varying(64) NOT NULL,
    item character varying(255) NOT NULL,
    role uuid,
    password character varying(255),
    user_created uuid,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    date_start timestamp with time zone,
    date_end timestamp with time zone,
    times_used integer DEFAULT 0,
    max_uses integer
);


ALTER TABLE public.directus_shares OWNER TO directus;

--
-- Name: directus_translations; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_translations (
    id uuid NOT NULL,
    language character varying(255) NOT NULL,
    key character varying(255) NOT NULL,
    value text NOT NULL
);


ALTER TABLE public.directus_translations OWNER TO directus;

--
-- Name: directus_users; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_users (
    id uuid NOT NULL,
    first_name character varying(50),
    last_name character varying(50),
    email character varying(128),
    password character varying(255),
    location character varying(255),
    title character varying(50),
    description text,
    tags json,
    avatar uuid,
    language character varying(255) DEFAULT NULL::character varying,
    tfa_secret character varying(255),
    status character varying(16) DEFAULT 'active'::character varying NOT NULL,
    role uuid,
    token character varying(255),
    last_access timestamp with time zone,
    last_page character varying(255),
    provider character varying(128) DEFAULT 'default'::character varying NOT NULL,
    external_identifier character varying(255),
    auth_data json,
    email_notifications boolean DEFAULT true,
    appearance character varying(255),
    theme_dark character varying(255),
    theme_light character varying(255),
    theme_light_overrides json,
    theme_dark_overrides json,
    text_direction character varying(255) DEFAULT 'auto'::character varying NOT NULL
);


ALTER TABLE public.directus_users OWNER TO directus;

--
-- Name: directus_versions; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_versions (
    id uuid NOT NULL,
    key character varying(64) NOT NULL,
    name character varying(255),
    collection character varying(64) NOT NULL,
    item character varying(255) NOT NULL,
    hash character varying(255),
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    date_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid,
    user_updated uuid,
    delta json
);


ALTER TABLE public.directus_versions OWNER TO directus;

--
-- Name: directus_webhooks; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_webhooks (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    method character varying(10) DEFAULT 'POST'::character varying NOT NULL,
    url character varying(255) NOT NULL,
    status character varying(10) DEFAULT 'active'::character varying NOT NULL,
    data boolean DEFAULT true NOT NULL,
    actions character varying(100) NOT NULL,
    collections character varying(255) NOT NULL,
    headers json,
    was_active_before_deprecation boolean DEFAULT false NOT NULL,
    migrated_flow uuid
);


ALTER TABLE public.directus_webhooks OWNER TO directus;

--
-- Name: directus_webhooks_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.directus_webhooks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.directus_webhooks_id_seq OWNER TO directus;

--
-- Name: directus_webhooks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.directus_webhooks_id_seq OWNED BY public.directus_webhooks.id;


--
-- Name: exercises; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.exercises (
    id integer NOT NULL,
    name character varying(255),
    description text,
    category integer
);


ALTER TABLE public.exercises OWNER TO directus;

--
-- Name: exercises_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.exercises_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exercises_id_seq OWNER TO directus;

--
-- Name: exercises_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.exercises_id_seq OWNED BY public.exercises.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    telegram_id bigint,
    username character varying(255) NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: workout_exercises; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workout_exercises (
    id bigint NOT NULL,
    workout_id bigint NOT NULL,
    directus_exercise_id character varying(255) NOT NULL,
    exercise_name character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.workout_exercises OWNER TO postgres;

--
-- Name: workout_exercises_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workout_exercises_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workout_exercises_id_seq OWNER TO postgres;

--
-- Name: workout_exercises_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workout_exercises_id_seq OWNED BY public.workout_exercises.id;


--
-- Name: workout_sets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workout_sets (
    id bigint NOT NULL,
    workout_exercise_id bigint NOT NULL,
    reps integer NOT NULL,
    weight numeric(10,2) NOT NULL,
    set_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT workout_sets_reps_check CHECK ((reps > 0)),
    CONSTRAINT workout_sets_set_order_check CHECK ((set_order > 0)),
    CONSTRAINT workout_sets_weight_check CHECK ((weight > (0)::numeric))
);


ALTER TABLE public.workout_sets OWNER TO postgres;

--
-- Name: workout_sets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workout_sets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workout_sets_id_seq OWNER TO postgres;

--
-- Name: workout_sets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workout_sets_id_seq OWNED BY public.workout_sets.id;


--
-- Name: workouts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workouts (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    workout_date date NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.workouts OWNER TO postgres;

--
-- Name: workouts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workouts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workouts_id_seq OWNER TO postgres;

--
-- Name: workouts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workouts_id_seq OWNED BY public.workouts.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: directus_activity id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_activity ALTER COLUMN id SET DEFAULT nextval('public.directus_activity_id_seq'::regclass);


--
-- Name: directus_fields id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_fields ALTER COLUMN id SET DEFAULT nextval('public.directus_fields_id_seq'::regclass);


--
-- Name: directus_notifications id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_notifications ALTER COLUMN id SET DEFAULT nextval('public.directus_notifications_id_seq'::regclass);


--
-- Name: directus_permissions id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_permissions ALTER COLUMN id SET DEFAULT nextval('public.directus_permissions_id_seq'::regclass);


--
-- Name: directus_presets id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_presets ALTER COLUMN id SET DEFAULT nextval('public.directus_presets_id_seq'::regclass);


--
-- Name: directus_relations id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_relations ALTER COLUMN id SET DEFAULT nextval('public.directus_relations_id_seq'::regclass);


--
-- Name: directus_revisions id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_revisions ALTER COLUMN id SET DEFAULT nextval('public.directus_revisions_id_seq'::regclass);


--
-- Name: directus_settings id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_settings ALTER COLUMN id SET DEFAULT nextval('public.directus_settings_id_seq'::regclass);


--
-- Name: directus_webhooks id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_webhooks ALTER COLUMN id SET DEFAULT nextval('public.directus_webhooks_id_seq'::regclass);


--
-- Name: exercises id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.exercises ALTER COLUMN id SET DEFAULT nextval('public.exercises_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: workout_exercises id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workout_exercises ALTER COLUMN id SET DEFAULT nextval('public.workout_exercises_id_seq'::regclass);


--
-- Name: workout_sets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workout_sets ALTER COLUMN id SET DEFAULT nextval('public.workout_sets_id_seq'::regclass);


--
-- Name: workouts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workouts ALTER COLUMN id SET DEFAULT nextval('public.workouts_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.categories (id, name) FROM stdin;
1	Грудь
2	Спина
3	Ноги
4	Плечи
5	Руки
6	Пресс
\.


--
-- Data for Name: directus_access; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_access (id, role, "user", policy, sort) FROM stdin;
f6082927-1239-48ff-b6b9-3f447b37db04	\N	\N	abf8a154-5b1c-4a46-ac9c-7300570f4f17	1
746ae83c-f8af-4b52-9db9-e50cddc96063	0805903a-a957-4007-967d-6a1d316bb4cc	\N	8965970e-8611-4d83-9c4a-339ed53eabac	\N
\.


--
-- Data for Name: directus_activity; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_activity (id, action, "user", "timestamp", ip, user_agent, collection, item, origin) FROM stdin;
1	login	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:25:56.358+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_users	d6d9c8b0-2255-4908-b25d-50cd46b714dd	http://localhost:8055
2	update	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:25:58.954+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_settings	1	http://localhost:8055
3	login	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:33:40.063+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_users	d6d9c8b0-2255-4908-b25d-50cd46b714dd	http://localhost:8055
4	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:43:37.428+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_fields	1	http://localhost:8055
5	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:43:37.433+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_collections	categories	http://localhost:8055
6	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:43:51.675+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_fields	2	http://localhost:8055
7	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:44:05.91+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_fields	3	http://localhost:8055
8	delete	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:45:09.837+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_fields	3	http://localhost:8055
9	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:45:25.295+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_fields	4	http://localhost:8055
10	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:45:25.299+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_collections	exercises	http://localhost:8055
11	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:45:33.391+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_fields	5	http://localhost:8055
12	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:45:41.594+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_fields	6	http://localhost:8055
13	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:46:02.595+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_fields	7	http://localhost:8055
14	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:46:26.254+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	categories	1	http://localhost:8055
15	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:46:34.541+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	categories	2	http://localhost:8055
16	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:46:40.719+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	categories	3	http://localhost:8055
17	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:46:46.301+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	categories	4	http://localhost:8055
18	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:46:52.333+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	categories	5	http://localhost:8055
19	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:46:57.935+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	categories	6	http://localhost:8055
20	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:47:11.483+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	exercises	1	http://localhost:8055
21	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:47:24.05+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	exercises	2	http://localhost:8055
22	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:47:37.901+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	exercises	3	http://localhost:8055
23	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:47:50.152+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	exercises	4	http://localhost:8055
24	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:48:02.989+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	exercises	5	http://localhost:8055
25	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:48:16.652+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	exercises	6	http://localhost:8055
26	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:48:28.198+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	exercises	7	http://localhost:8055
27	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:48:44.734+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	exercises	8	http://localhost:8055
28	login	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:50:07.158+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_users	d6d9c8b0-2255-4908-b25d-50cd46b714dd	http://localhost:8055
29	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:50:35.109+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	1	http://localhost:8055
30	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:50:35.116+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	2	http://localhost:8055
31	update	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 19:50:35.118+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_policies	abf8a154-5b1c-4a46-ac9c-7300570f4f17	http://localhost:8055
32	login	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-03 20:25:38.599+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_users	d6d9c8b0-2255-4908-b25d-50cd46b714dd	http://localhost:8055
33	login	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 08:13:02.78+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_users	d6d9c8b0-2255-4908-b25d-50cd46b714dd	http://localhost:8055
34	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 08:13:51.681+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	exercises	9	http://localhost:8055
35	login	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:07:24.614+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_users	d6d9c8b0-2255-4908-b25d-50cd46b714dd	http://localhost:8055
36	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:07:45.405+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_collections	users	http://localhost:8055
37	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:10:50.18+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_collections	workout_exercises	http://localhost:8055
38	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:11:05.144+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_collections	workout_sets	http://localhost:8055
39	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:11:07.858+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_collections	workouts	http://localhost:8055
40	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:12:10.784+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	3	http://localhost:8055
41	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:12:10.792+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	4	http://localhost:8055
42	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:12:10.796+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	5	http://localhost:8055
43	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:12:10.8+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	6	http://localhost:8055
44	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:12:10.803+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	7	http://localhost:8055
45	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:12:10.807+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	8	http://localhost:8055
46	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:12:10.81+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	9	http://localhost:8055
47	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:12:10.813+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	10	http://localhost:8055
48	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:12:10.815+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	11	http://localhost:8055
49	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:12:10.817+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	12	http://localhost:8055
50	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:12:10.82+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	13	http://localhost:8055
51	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:12:10.822+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	14	http://localhost:8055
52	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:12:10.823+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	15	http://localhost:8055
53	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:12:10.825+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	16	http://localhost:8055
54	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:12:10.827+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	17	http://localhost:8055
55	create	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:12:10.829+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_permissions	18	http://localhost:8055
56	update	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 13:12:10.832+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	directus_policies	abf8a154-5b1c-4a46-ac9c-7300570f4f17	http://localhost:8055
57	create	\N	2025-11-04 13:27:58.846+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	users	3	http://localhost:5173
58	create	\N	2025-11-04 13:29:41.031+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workouts	1	http://localhost:5173
59	create	\N	2025-11-04 13:29:41.06+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	1	http://localhost:5173
60	create	\N	2025-11-04 13:36:16.317+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workouts	2	http://localhost:5173
61	create	\N	2025-11-04 13:36:16.34+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	2	http://localhost:5173
62	create	\N	2025-11-04 13:36:16.355+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	1	http://localhost:5173
63	create	\N	2025-11-04 13:36:16.367+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	3	http://localhost:5173
64	create	\N	2025-11-04 13:36:20.091+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	4	http://localhost:5173
65	create	\N	2025-11-04 13:36:20.105+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	2	http://localhost:5173
66	create	\N	2025-11-04 13:36:20.116+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	5	http://localhost:5173
67	create	\N	2025-11-04 13:36:22.666+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	6	http://localhost:5173
68	create	\N	2025-11-04 13:36:54.452+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	7	http://localhost:5173
69	create	\N	2025-11-04 13:37:02.162+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workouts	3	http://localhost:5173
70	create	\N	2025-11-04 13:37:02.184+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	8	http://localhost:5173
71	create	\N	2025-11-04 13:37:02.195+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	3	http://localhost:5173
72	create	\N	2025-11-04 13:38:00.917+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workouts	4	http://localhost:5174
73	create	\N	2025-11-04 13:38:00.937+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	9	http://localhost:5174
74	create	\N	2025-11-04 13:38:00.949+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	4	http://localhost:5174
75	create	\N	2025-11-04 13:44:18.442+00	172.66.0.96	curl/8.7.1	workout_exercises	10	\N
76	create	\N	2025-11-04 13:46:00.186+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	11	http://localhost:5174
77	create	\N	2025-11-04 13:46:18.632+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workouts	5	http://localhost:5174
78	create	\N	2025-11-04 13:46:18.647+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	12	http://localhost:5174
79	create	\N	2025-11-04 13:46:18.661+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	5	http://localhost:5174
80	create	\N	2025-11-04 13:46:23.272+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	13	http://localhost:5174
81	create	\N	2025-11-04 13:46:23.286+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	6	http://localhost:5174
82	create	\N	2025-11-04 13:50:13.383+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	14	http://localhost:5174
83	create	\N	2025-11-04 13:50:13.402+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	7	http://localhost:5174
84	create	\N	2025-11-04 13:50:18.827+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	15	http://localhost:5174
85	create	\N	2025-11-04 13:50:18.839+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	8	http://localhost:5174
86	create	\N	2025-11-04 13:50:35.299+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workouts	6	http://localhost:5174
87	create	\N	2025-11-04 13:50:35.314+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	16	http://localhost:5174
88	create	\N	2025-11-04 13:50:35.325+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	9	http://localhost:5174
89	create	\N	2025-11-04 13:51:26.849+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	17	http://localhost:5174
90	create	\N	2025-11-04 13:51:26.864+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	10	http://localhost:5174
91	create	\N	2025-11-04 13:51:26.877+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	11	http://localhost:5174
92	create	\N	2025-11-04 13:51:51.727+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	18	http://localhost:5174
93	create	\N	2025-11-04 13:51:51.754+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	12	http://localhost:5174
94	create	\N	2025-11-04 13:51:57.067+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	19	http://localhost:5174
95	create	\N	2025-11-04 13:51:57.081+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	13	http://localhost:5174
96	create	\N	2025-11-04 13:51:57.107+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	14	http://localhost:5174
97	create	\N	2025-11-04 13:52:02.477+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	20	http://localhost:5174
98	create	\N	2025-11-04 13:52:02.49+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	15	http://localhost:5174
99	create	\N	2025-11-04 13:52:02.513+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	16	http://localhost:5174
100	create	\N	2025-11-04 13:52:02.524+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	17	http://localhost:5174
101	create	\N	2025-11-04 13:52:14.41+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	21	http://localhost:5174
102	create	\N	2025-11-04 13:52:14.422+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	18	http://localhost:5174
103	create	\N	2025-11-04 13:52:14.448+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	19	http://localhost:5174
104	create	\N	2025-11-04 13:52:14.462+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	20	http://localhost:5174
105	create	\N	2025-11-04 13:52:14.474+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	22	http://localhost:5174
106	create	\N	2025-11-04 13:52:14.486+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	21	http://localhost:5174
107	create	\N	2025-11-04 13:52:20.457+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	23	http://localhost:5174
108	create	\N	2025-11-04 13:52:20.469+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	22	http://localhost:5174
109	create	\N	2025-11-04 13:52:20.482+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	23	http://localhost:5174
110	create	\N	2025-11-04 13:52:20.523+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	24	http://localhost:5174
111	create	\N	2025-11-04 13:52:20.544+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	24	http://localhost:5174
112	create	\N	2025-11-04 13:52:20.565+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	25	http://localhost:5174
113	create	\N	2025-11-04 13:52:22.181+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	25	http://localhost:5174
114	create	\N	2025-11-04 13:52:22.193+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	26	http://localhost:5174
115	create	\N	2025-11-04 13:52:22.205+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	27	http://localhost:5174
116	create	\N	2025-11-04 13:52:22.216+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	28	http://localhost:5174
117	create	\N	2025-11-04 13:52:22.228+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	26	http://localhost:5174
118	create	\N	2025-11-04 13:52:22.239+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	29	http://localhost:5174
119	create	\N	2025-11-04 13:52:26.474+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	27	http://localhost:5174
120	create	\N	2025-11-04 13:52:26.494+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	30	http://localhost:5174
121	create	\N	2025-11-04 13:55:38.592+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	28	http://localhost:5174
122	create	\N	2025-11-04 13:55:38.604+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	31	http://localhost:5174
123	create	\N	2025-11-04 13:55:48.644+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workouts	7	http://localhost:5174
124	create	\N	2025-11-04 13:55:48.657+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	29	http://localhost:5174
125	create	\N	2025-11-04 13:55:48.668+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	32	http://localhost:5174
126	create	\N	2025-11-04 13:55:51.144+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	30	http://localhost:5174
127	create	\N	2025-11-04 13:55:51.158+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	33	http://localhost:5174
128	create	\N	2025-11-04 13:55:51.168+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	34	http://localhost:5174
129	create	\N	2025-11-04 13:55:53.288+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	31	http://localhost:5174
130	create	\N	2025-11-04 13:55:53.302+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	35	http://localhost:5174
131	create	\N	2025-11-04 13:55:53.314+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	36	http://localhost:5174
132	create	\N	2025-11-04 13:55:53.329+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	37	http://localhost:5174
133	create	\N	2025-11-04 13:55:54.155+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	32	http://localhost:5174
134	create	\N	2025-11-04 13:55:54.196+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	38	http://localhost:5174
135	create	\N	2025-11-04 13:55:54.22+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	39	http://localhost:5174
136	create	\N	2025-11-04 13:55:54.235+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	40	http://localhost:5174
137	create	\N	2025-11-04 13:56:26.735+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	33	http://localhost:5174
138	create	\N	2025-11-04 13:56:26.748+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	41	http://localhost:5174
139	create	\N	2025-11-04 13:56:26.763+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	42	http://localhost:5174
140	create	\N	2025-11-04 13:56:26.787+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	43	http://localhost:5174
141	create	\N	2025-11-04 13:56:26.799+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	44	http://localhost:5174
142	create	\N	2025-11-04 13:56:43.877+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	34	http://localhost:5174
143	create	\N	2025-11-04 13:56:43.89+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	45	http://localhost:5174
144	create	\N	2025-11-04 13:56:43.904+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	46	http://localhost:5174
145	create	\N	2025-11-04 13:56:43.926+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	47	http://localhost:5174
146	create	\N	2025-11-04 13:56:43.938+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	48	http://localhost:5174
147	create	\N	2025-11-04 13:56:43.95+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	35	http://localhost:5174
148	create	\N	2025-11-04 13:56:43.961+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	49	http://localhost:5174
149	create	\N	2025-11-04 13:56:48.958+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	36	http://localhost:5174
150	create	\N	2025-11-04 13:56:48.969+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	50	http://localhost:5174
151	create	\N	2025-11-04 13:56:48.982+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	51	http://localhost:5174
152	create	\N	2025-11-04 13:56:48.992+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	52	http://localhost:5174
153	create	\N	2025-11-04 13:56:49.002+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	53	http://localhost:5174
154	create	\N	2025-11-04 13:56:49.012+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	37	http://localhost:5174
155	create	\N	2025-11-04 13:56:49.022+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	54	http://localhost:5174
156	create	\N	2025-11-04 13:56:49.033+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	55	http://localhost:5174
157	create	\N	2025-11-04 13:56:52.24+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	38	http://localhost:5174
158	create	\N	2025-11-04 13:56:52.252+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	56	http://localhost:5174
159	create	\N	2025-11-04 13:56:52.264+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	57	http://localhost:5174
160	create	\N	2025-11-04 13:56:52.284+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	58	http://localhost:5174
161	create	\N	2025-11-04 13:56:52.3+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	59	http://localhost:5174
162	create	\N	2025-11-04 13:56:52.332+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	39	http://localhost:5174
163	create	\N	2025-11-04 13:56:52.342+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	60	http://localhost:5174
164	create	\N	2025-11-04 13:56:52.352+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	61	http://localhost:5174
165	create	\N	2025-11-04 13:56:52.363+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	62	http://localhost:5174
166	create	\N	2025-11-04 13:56:53.31+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	40	http://localhost:5174
167	create	\N	2025-11-04 13:56:53.326+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	63	http://localhost:5174
168	create	\N	2025-11-04 13:56:53.336+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	64	http://localhost:5174
169	create	\N	2025-11-04 13:56:53.348+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	65	http://localhost:5174
170	create	\N	2025-11-04 13:56:53.359+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	66	http://localhost:5174
171	create	\N	2025-11-04 13:56:53.368+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	41	http://localhost:5174
172	create	\N	2025-11-04 13:56:53.38+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	67	http://localhost:5174
173	create	\N	2025-11-04 13:56:53.389+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	68	http://localhost:5174
174	create	\N	2025-11-04 13:56:53.4+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	69	http://localhost:5174
175	create	\N	2025-11-04 13:57:03.584+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	42	http://localhost:5174
176	create	\N	2025-11-04 13:59:41.21+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	43	http://localhost:5174
177	create	\N	2025-11-04 13:59:41.225+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	70	http://localhost:5174
178	create	\N	2025-11-04 13:59:41.237+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	71	http://localhost:5174
179	create	\N	2025-11-04 13:59:41.248+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	72	http://localhost:5174
180	create	\N	2025-11-04 14:00:18.993+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workouts	8	http://localhost:5174
181	create	\N	2025-11-04 14:00:19.006+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	44	http://localhost:5174
182	create	\N	2025-11-04 14:00:19.016+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	73	http://localhost:5174
183	create	\N	2025-11-04 14:00:21.445+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	45	http://localhost:5174
184	create	\N	2025-11-04 14:00:21.458+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	74	http://localhost:5174
185	create	\N	2025-11-04 14:00:21.468+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	75	http://localhost:5174
186	create	\N	2025-11-04 14:00:24.45+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	46	http://localhost:5174
187	create	\N	2025-11-04 14:00:24.461+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	76	http://localhost:5174
188	create	\N	2025-11-04 14:00:24.475+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	77	http://localhost:5174
189	create	\N	2025-11-04 14:00:59.79+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	47	http://localhost:5174
190	create	\N	2025-11-04 14:00:59.804+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	78	http://localhost:5174
191	create	\N	2025-11-04 14:00:59.816+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	79	http://localhost:5174
192	create	\N	2025-11-04 14:00:59.827+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	48	http://localhost:5174
193	create	\N	2025-11-04 14:00:59.837+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	80	http://localhost:5174
194	create	\N	2025-11-04 14:01:02.791+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	49	http://localhost:5174
195	create	\N	2025-11-04 14:01:02.803+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	81	http://localhost:5174
196	create	\N	2025-11-04 14:01:02.824+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	82	http://localhost:5174
197	create	\N	2025-11-04 14:01:02.836+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	50	http://localhost:5174
198	create	\N	2025-11-04 14:01:02.845+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	83	http://localhost:5174
199	create	\N	2025-11-04 14:01:02.855+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	84	http://localhost:5174
200	create	\N	2025-11-04 14:01:10.102+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	51	http://localhost:5174
201	create	\N	2025-11-04 14:01:10.113+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	85	http://localhost:5174
202	create	\N	2025-11-04 14:01:10.124+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	86	http://localhost:5174
203	create	\N	2025-11-04 14:01:10.135+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	52	http://localhost:5174
204	create	\N	2025-11-04 14:01:10.145+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	87	http://localhost:5174
205	create	\N	2025-11-04 14:01:10.154+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	88	http://localhost:5174
206	create	\N	2025-11-04 14:01:12.841+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	53	http://localhost:5174
207	create	\N	2025-11-04 14:01:12.851+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	89	http://localhost:5174
208	create	\N	2025-11-04 14:01:12.862+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	90	http://localhost:5174
209	create	\N	2025-11-04 14:01:12.876+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_exercises	54	http://localhost:5174
210	create	\N	2025-11-04 14:01:12.886+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	91	http://localhost:5174
211	create	\N	2025-11-04 14:01:12.896+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	workout_sets	92	http://localhost:5174
212	create	\N	2025-11-04 14:01:17.625+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	55	http://localhost:5174
213	create	\N	2025-11-04 14:01:17.64+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	93	http://localhost:5174
214	create	\N	2025-11-04 14:01:17.691+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	94	http://localhost:5174
215	create	\N	2025-11-04 14:01:17.707+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	56	http://localhost:5174
216	create	\N	2025-11-04 14:01:17.722+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	95	http://localhost:5174
217	create	\N	2025-11-04 14:01:17.736+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	96	http://localhost:5174
218	create	\N	2025-11-04 14:07:11.353+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	users	4	http://localhost:5174
219	create	\N	2025-11-04 14:09:09.748+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workouts	9	http://localhost:5174
220	create	\N	2025-11-04 14:09:09.781+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	57	http://localhost:5174
221	create	\N	2025-11-04 14:09:09.825+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	97	http://localhost:5174
222	create	\N	2025-11-04 14:09:09.839+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	58	http://localhost:5174
223	create	\N	2025-11-04 14:09:13.709+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	59	http://localhost:5174
224	create	\N	2025-11-04 14:09:13.722+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	98	http://localhost:5174
225	create	\N	2025-11-04 14:09:13.732+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	60	http://localhost:5174
226	create	\N	2025-11-04 14:09:13.741+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	99	http://localhost:5174
227	create	\N	2025-11-04 14:09:50.294+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 YaBrowser/25.8.0.0 Safari/537.36	workout_exercises	61	http://localhost:5174
228	create	\N	2025-11-04 14:09:50.307+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 YaBrowser/25.8.0.0 Safari/537.36	workout_sets	100	http://localhost:5174
229	create	\N	2025-11-04 14:14:35.243+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	62	http://localhost:5174
230	create	\N	2025-11-04 14:14:35.289+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	101	http://localhost:5174
231	create	\N	2025-11-04 14:14:35.301+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	63	http://localhost:5174
232	create	\N	2025-11-04 14:14:35.315+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	102	http://localhost:5174
233	create	\N	2025-11-04 14:14:40.003+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	64	http://localhost:5174
234	create	\N	2025-11-04 14:14:40.016+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	103	http://localhost:5174
235	create	\N	2025-11-04 14:14:40.029+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	65	http://localhost:5174
236	create	\N	2025-11-04 14:14:40.038+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	104	http://localhost:5174
237	create	\N	2025-11-04 14:15:02.041+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	66	http://localhost:5174
238	create	\N	2025-11-04 14:15:02.057+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	105	http://localhost:5174
239	create	\N	2025-11-04 14:15:02.067+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_exercises	67	http://localhost:5174
240	create	\N	2025-11-04 14:15:02.076+00	192.168.65.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	workout_sets	106	http://localhost:5174
\.


--
-- Data for Name: directus_collections; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_collections (collection, icon, note, display_template, hidden, singleton, translations, archive_field, archive_app_filter, archive_value, unarchive_value, sort_field, accountability, color, item_duplication_fields, sort, "group", collapse, preview_url, versioning) FROM stdin;
categories	\N	\N	\N	f	f	\N	\N	t	\N	\N	\N	all	\N	\N	\N	\N	open	\N	f
exercises	\N	\N	\N	f	f	\N	\N	t	\N	\N	\N	all	\N	\N	\N	\N	open	\N	f
users	\N	\N	\N	f	f	\N	\N	t	\N	\N	\N	all	\N	\N	\N	\N	open	\N	f
workout_exercises	\N	\N	\N	f	f	\N	\N	t	\N	\N	\N	all	\N	\N	\N	\N	open	\N	f
workout_sets	\N	\N	\N	f	f	\N	\N	t	\N	\N	\N	all	\N	\N	\N	\N	open	\N	f
workouts	\N	\N	\N	f	f	\N	\N	t	\N	\N	\N	all	\N	\N	\N	\N	open	\N	f
\.


--
-- Data for Name: directus_comments; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_comments (id, collection, item, comment, date_created, date_updated, user_created, user_updated) FROM stdin;
\.


--
-- Data for Name: directus_dashboards; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_dashboards (id, name, icon, note, date_created, user_created, color) FROM stdin;
\.


--
-- Data for Name: directus_extensions; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_extensions (enabled, id, folder, source, bundle) FROM stdin;
\.


--
-- Data for Name: directus_fields; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_fields (id, collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, conditions, required, "group", validation, validation_message) FROM stdin;
1	categories	id	\N	input	\N	\N	\N	t	t	1	full	\N	\N	\N	f	\N	\N	\N
2	categories	name	\N	input	\N	\N	\N	f	f	2	full	\N	\N	\N	f	\N	\N	\N
4	exercises	id	\N	input	\N	\N	\N	t	t	1	full	\N	\N	\N	f	\N	\N	\N
5	exercises	name	\N	input	\N	\N	\N	f	f	2	full	\N	\N	\N	f	\N	\N	\N
6	exercises	description	\N	input-multiline	\N	\N	\N	f	f	3	full	\N	\N	\N	f	\N	\N	\N
7	exercises	category	m2o	select-dropdown-m2o	\N	\N	\N	f	f	4	full	\N	\N	\N	f	\N	\N	\N
\.


--
-- Data for Name: directus_files; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_files (id, storage, filename_disk, filename_download, title, type, folder, uploaded_by, created_on, modified_by, modified_on, charset, filesize, width, height, duration, embed, description, location, tags, metadata, focal_point_x, focal_point_y, tus_id, tus_data, uploaded_on) FROM stdin;
\.


--
-- Data for Name: directus_flows; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_flows (id, name, icon, color, description, status, trigger, accountability, options, operation, date_created, user_created) FROM stdin;
\.


--
-- Data for Name: directus_folders; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_folders (id, name, parent) FROM stdin;
\.


--
-- Data for Name: directus_migrations; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_migrations (version, name, "timestamp") FROM stdin;
20201028A	Remove Collection Foreign Keys	2025-11-03 19:19:19.074898+00
20201029A	Remove System Relations	2025-11-03 19:19:19.082396+00
20201029B	Remove System Collections	2025-11-03 19:19:19.089075+00
20201029C	Remove System Fields	2025-11-03 19:19:19.099557+00
20201105A	Add Cascade System Relations	2025-11-03 19:19:19.129867+00
20201105B	Change Webhook URL Type	2025-11-03 19:19:19.135982+00
20210225A	Add Relations Sort Field	2025-11-03 19:19:19.140702+00
20210304A	Remove Locked Fields	2025-11-03 19:19:19.14325+00
20210312A	Webhooks Collections Text	2025-11-03 19:19:19.149497+00
20210331A	Add Refresh Interval	2025-11-03 19:19:19.152049+00
20210415A	Make Filesize Nullable	2025-11-03 19:19:19.156308+00
20210416A	Add Collections Accountability	2025-11-03 19:19:19.159525+00
20210422A	Remove Files Interface	2025-11-03 19:19:19.162759+00
20210506A	Rename Interfaces	2025-11-03 19:19:19.17967+00
20210510A	Restructure Relations	2025-11-03 19:19:19.189369+00
20210518A	Add Foreign Key Constraints	2025-11-03 19:19:19.197554+00
20210519A	Add System Fk Triggers	2025-11-03 19:19:19.220285+00
20210521A	Add Collections Icon Color	2025-11-03 19:19:19.222219+00
20210525A	Add Insights	2025-11-03 19:19:19.23448+00
20210608A	Add Deep Clone Config	2025-11-03 19:19:19.236737+00
20210626A	Change Filesize Bigint	2025-11-03 19:19:19.245394+00
20210716A	Add Conditions to Fields	2025-11-03 19:19:19.247641+00
20210721A	Add Default Folder	2025-11-03 19:19:19.25299+00
20210802A	Replace Groups	2025-11-03 19:19:19.25678+00
20210803A	Add Required to Fields	2025-11-03 19:19:19.258666+00
20210805A	Update Groups	2025-11-03 19:19:19.261978+00
20210805B	Change Image Metadata Structure	2025-11-03 19:19:19.265401+00
20210811A	Add Geometry Config	2025-11-03 19:19:19.268321+00
20210831A	Remove Limit Column	2025-11-03 19:19:19.271194+00
20210903A	Add Auth Provider	2025-11-03 19:19:19.28709+00
20210907A	Webhooks Collections Not Null	2025-11-03 19:19:19.291207+00
20210910A	Move Module Setup	2025-11-03 19:19:19.293495+00
20210920A	Webhooks URL Not Null	2025-11-03 19:19:19.299691+00
20210924A	Add Collection Organization	2025-11-03 19:19:19.306397+00
20210927A	Replace Fields Group	2025-11-03 19:19:19.315664+00
20210927B	Replace M2M Interface	2025-11-03 19:19:19.317932+00
20210929A	Rename Login Action	2025-11-03 19:19:19.320228+00
20211007A	Update Presets	2025-11-03 19:19:19.325469+00
20211009A	Add Auth Data	2025-11-03 19:19:19.327373+00
20211016A	Add Webhook Headers	2025-11-03 19:19:19.329507+00
20211103A	Set Unique to User Token	2025-11-03 19:19:19.332335+00
20211103B	Update Special Geometry	2025-11-03 19:19:19.3337+00
20211104A	Remove Collections Listing	2025-11-03 19:19:19.335048+00
20211118A	Add Notifications	2025-11-03 19:19:19.346158+00
20211211A	Add Shares	2025-11-03 19:19:19.358467+00
20211230A	Add Project Descriptor	2025-11-03 19:19:19.360153+00
20220303A	Remove Default Project Color	2025-11-03 19:19:19.36475+00
20220308A	Add Bookmark Icon and Color	2025-11-03 19:19:19.366783+00
20220314A	Add Translation Strings	2025-11-03 19:19:19.36893+00
20220322A	Rename Field Typecast Flags	2025-11-03 19:19:19.381365+00
20220323A	Add Field Validation	2025-11-03 19:19:19.389896+00
20220325A	Fix Typecast Flags	2025-11-03 19:19:19.404373+00
20220325B	Add Default Language	2025-11-03 19:19:19.41851+00
20220402A	Remove Default Value Panel Icon	2025-11-03 19:19:19.434184+00
20220429A	Add Flows	2025-11-03 19:19:19.467603+00
20220429B	Add Color to Insights Icon	2025-11-03 19:19:19.469946+00
20220429C	Drop Non Null From IP of Activity	2025-11-03 19:19:19.472158+00
20220429D	Drop Non Null From Sender of Notifications	2025-11-03 19:19:19.475967+00
20220614A	Rename Hook Trigger to Event	2025-11-03 19:19:19.481405+00
20220801A	Update Notifications Timestamp Column	2025-11-03 19:19:19.488377+00
20220802A	Add Custom Aspect Ratios	2025-11-03 19:19:19.492678+00
20220826A	Add Origin to Accountability	2025-11-03 19:19:19.497548+00
20230401A	Update Material Icons	2025-11-03 19:19:19.503828+00
20230525A	Add Preview Settings	2025-11-03 19:19:19.505729+00
20230526A	Migrate Translation Strings	2025-11-03 19:19:19.513832+00
20230721A	Require Shares Fields	2025-11-03 19:19:19.519373+00
20230823A	Add Content Versioning	2025-11-03 19:19:19.542237+00
20230927A	Themes	2025-11-03 19:19:19.570132+00
20231009A	Update CSV Fields to Text	2025-11-03 19:19:19.57797+00
20231009B	Update Panel Options	2025-11-03 19:19:19.582867+00
20231010A	Add Extensions	2025-11-03 19:19:19.587772+00
20231215A	Add Focalpoints	2025-11-03 19:19:19.591083+00
20240122A	Add Report URL Fields	2025-11-03 19:19:19.597154+00
20240204A	Marketplace	2025-11-03 19:19:19.615832+00
20240305A	Change Useragent Type	2025-11-03 19:19:19.624989+00
20240311A	Deprecate Webhooks	2025-11-03 19:19:19.638518+00
20240422A	Public Registration	2025-11-03 19:19:19.643462+00
20240515A	Add Session Window	2025-11-03 19:19:19.645881+00
20240701A	Add Tus Data	2025-11-03 19:19:19.648254+00
20240716A	Update Files Date Fields	2025-11-03 19:19:19.65423+00
20240806A	Permissions Policies	2025-11-03 19:19:19.701144+00
20240817A	Update Icon Fields Length	2025-11-03 19:19:19.718213+00
20240909A	Separate Comments	2025-11-03 19:19:19.731083+00
20240909B	Consolidate Content Versioning	2025-11-03 19:19:19.739707+00
20240924A	Migrate Legacy Comments	2025-11-03 19:19:19.747217+00
20240924B	Populate Versioning Deltas	2025-11-03 19:19:19.751623+00
20250224A	Visual Editor	2025-11-03 19:19:19.754662+00
20250609A	License Banner	2025-11-03 19:19:19.758576+00
20250613A	Add Project ID	2025-11-03 19:19:19.769199+00
20250718A	Add Direction	2025-11-03 19:19:19.771312+00
20250813A	Add MCP	2025-11-03 19:19:19.773913+00
\.


--
-- Data for Name: directus_notifications; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_notifications (id, "timestamp", status, recipient, sender, subject, message, collection, item) FROM stdin;
\.


--
-- Data for Name: directus_operations; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_operations (id, name, key, type, position_x, position_y, options, resolve, reject, flow, date_created, user_created) FROM stdin;
\.


--
-- Data for Name: directus_panels; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_panels (id, dashboard, name, icon, color, show_header, note, type, position_x, position_y, width, height, options, date_created, user_created) FROM stdin;
\.


--
-- Data for Name: directus_permissions; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_permissions (id, collection, action, permissions, validation, presets, fields, policy) FROM stdin;
1	categories	read	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
2	exercises	read	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
3	users	create	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
4	users	read	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
5	users	update	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
6	users	delete	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
7	workout_exercises	create	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
8	workout_exercises	read	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
9	workout_exercises	update	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
10	workout_exercises	delete	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
11	workout_sets	create	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
12	workout_sets	read	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
13	workout_sets	update	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
14	workout_sets	delete	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
15	workouts	create	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
16	workouts	read	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
17	workouts	update	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
18	workouts	delete	\N	\N	\N	*	abf8a154-5b1c-4a46-ac9c-7300570f4f17
19	workout_exercises	delete	{}	{}	\N	\N	abf8a154-5b1c-4a46-ac9c-7300570f4f17
\.


--
-- Data for Name: directus_policies; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_policies (id, name, icon, description, ip_access, enforce_tfa, admin_access, app_access) FROM stdin;
abf8a154-5b1c-4a46-ac9c-7300570f4f17	$t:public_label	public	$t:public_description	\N	f	f	f
8965970e-8611-4d83-9c4a-339ed53eabac	Administrator	verified	$t:admin_description	\N	f	t	t
\.


--
-- Data for Name: directus_presets; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_presets (id, bookmark, "user", role, collection, search, layout, layout_query, layout_options, refresh_interval, filter, icon, color) FROM stdin;
1	\N	d6d9c8b0-2255-4908-b25d-50cd46b714dd	\N	directus_files	\N	cards	{"cards":{"sort":["-uploaded_on"],"page":1}}	{"cards":{"icon":"insert_drive_file","title":"{{ title }}","subtitle":"{{ type }} • {{ filesize }}","size":4,"imageFit":"crop"}}	\N	\N	bookmark	\N
2	\N	d6d9c8b0-2255-4908-b25d-50cd46b714dd	\N	workout_exercises	\N	\N	{"tabular":{"page":1}}	\N	\N	\N	bookmark	\N
\.


--
-- Data for Name: directus_relations; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_relations (id, many_collection, many_field, one_collection, one_field, one_collection_field, one_allowed_collections, junction_field, sort_field, one_deselect_action) FROM stdin;
1	exercises	category	categories	\N	\N	\N	\N	\N	nullify
\.


--
-- Data for Name: directus_revisions; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_revisions (id, activity, collection, item, data, delta, parent, version) FROM stdin;
1	2	directus_settings	1	{"id":1,"project_name":"Directus","project_url":null,"project_color":"#6644FF","project_logo":null,"public_foreground":null,"public_background":null,"public_note":null,"auth_login_attempts":25,"auth_password_policy":null,"storage_asset_transform":"all","storage_asset_presets":null,"custom_css":null,"storage_default_folder":null,"basemaps":null,"mapbox_key":null,"module_bar":null,"project_descriptor":null,"default_language":"en-US","custom_aspect_ratios":null,"public_favicon":null,"default_appearance":"auto","default_theme_light":null,"theme_light_overrides":null,"default_theme_dark":null,"theme_dark_overrides":null,"report_error_url":null,"report_bug_url":null,"report_feature_url":null,"public_registration":false,"public_registration_verify_email":true,"public_registration_role":null,"public_registration_email_filter":null,"visual_editor_urls":null,"accepted_terms":true,"project_id":"019a4b28-d9d7-76dc-9fcc-1ae3d127c220","mcp_enabled":false,"mcp_allow_deletes":false,"mcp_prompts_collection":null,"mcp_system_prompt_enabled":true,"mcp_system_prompt":null}	{"accepted_terms":true}	\N	\N
2	4	directus_fields	1	{"sort":1,"hidden":true,"interface":"input","readonly":true,"field":"id","collection":"categories"}	{"sort":1,"hidden":true,"interface":"input","readonly":true,"field":"id","collection":"categories"}	\N	\N
3	5	directus_collections	categories	{"singleton":false,"collection":"categories"}	{"singleton":false,"collection":"categories"}	\N	\N
4	6	directus_fields	2	{"sort":2,"interface":"input","special":null,"collection":"categories","field":"name"}	{"sort":2,"interface":"input","special":null,"collection":"categories","field":"name"}	\N	\N
5	7	directus_fields	3	{"sort":3,"interface":"input-multiline","special":null,"collection":"categories","field":"description"}	{"sort":3,"interface":"input-multiline","special":null,"collection":"categories","field":"description"}	\N	\N
6	9	directus_fields	4	{"sort":1,"hidden":true,"interface":"input","readonly":true,"field":"id","collection":"exercises"}	{"sort":1,"hidden":true,"interface":"input","readonly":true,"field":"id","collection":"exercises"}	\N	\N
7	10	directus_collections	exercises	{"singleton":false,"collection":"exercises"}	{"singleton":false,"collection":"exercises"}	\N	\N
8	11	directus_fields	5	{"sort":2,"interface":"input","special":null,"collection":"exercises","field":"name"}	{"sort":2,"interface":"input","special":null,"collection":"exercises","field":"name"}	\N	\N
9	12	directus_fields	6	{"sort":3,"interface":"input-multiline","special":null,"collection":"exercises","field":"description"}	{"sort":3,"interface":"input-multiline","special":null,"collection":"exercises","field":"description"}	\N	\N
10	13	directus_fields	7	{"sort":4,"interface":"select-dropdown-m2o","special":["m2o"],"collection":"exercises","field":"category"}	{"sort":4,"interface":"select-dropdown-m2o","special":["m2o"],"collection":"exercises","field":"category"}	\N	\N
11	14	categories	1	{"name":"Грудь"}	{"name":"Грудь"}	\N	\N
12	15	categories	2	{"name":"Спина"}	{"name":"Спина"}	\N	\N
13	16	categories	3	{"name":"Ноги"}	{"name":"Ноги"}	\N	\N
14	17	categories	4	{"name":"Плечи"}	{"name":"Плечи"}	\N	\N
15	18	categories	5	{"name":"Руки"}	{"name":"Руки"}	\N	\N
16	19	categories	6	{"name":"Пресс"}	{"name":"Пресс"}	\N	\N
17	20	exercises	1	{"name":"Жим лёжа","category":1}	{"name":"Жим лёжа","category":1}	\N	\N
18	21	exercises	2	{"name":"Отжимания","category":1}	{"name":"Отжимания","category":1}	\N	\N
19	22	exercises	3	{"name":"Подтягивания","category":2}	{"name":"Подтягивания","category":2}	\N	\N
20	23	exercises	4	{"name":"Тяга штанги в наклоне","category":2}	{"name":"Тяга штанги в наклоне","category":2}	\N	\N
21	24	exercises	5	{"name":"Становая тяга","category":3}	{"name":"Становая тяга","category":3}	\N	\N
22	25	exercises	6	{"name":"Жим над головой","category":4}	{"name":"Жим над головой","category":4}	\N	\N
23	26	exercises	7	{"name":"Разводки гантелей в стороны","category":4}	{"name":"Разводки гантелей в стороны","category":4}	\N	\N
24	27	exercises	8	{"name":"Сгибание рук со штангой","category":5}	{"name":"Сгибание рук со штангой","category":5}	\N	\N
25	29	directus_permissions	1	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"categories","action":"read"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"categories","action":"read"}	\N	\N
26	30	directus_permissions	2	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"exercises","action":"read"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"exercises","action":"read"}	\N	\N
27	34	exercises	9	{"name":"Скручивания на фитболе","category":6}	{"name":"Скручивания на фитболе","category":6}	\N	\N
28	36	directus_collections	users	{"collection":"users"}	{"collection":"users"}	\N	\N
29	37	directus_collections	workout_exercises	{"collection":"workout_exercises"}	{"collection":"workout_exercises"}	\N	\N
30	38	directus_collections	workout_sets	{"collection":"workout_sets"}	{"collection":"workout_sets"}	\N	\N
31	39	directus_collections	workouts	{"collection":"workouts"}	{"collection":"workouts"}	\N	\N
32	40	directus_permissions	3	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"users","action":"create"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"users","action":"create"}	\N	\N
33	41	directus_permissions	4	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"users","action":"read"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"users","action":"read"}	\N	\N
34	42	directus_permissions	5	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"users","action":"update"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"users","action":"update"}	\N	\N
35	43	directus_permissions	6	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"users","action":"delete"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"users","action":"delete"}	\N	\N
36	44	directus_permissions	7	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workout_exercises","action":"create"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workout_exercises","action":"create"}	\N	\N
37	45	directus_permissions	8	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workout_exercises","action":"read"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workout_exercises","action":"read"}	\N	\N
38	46	directus_permissions	9	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workout_exercises","action":"update"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workout_exercises","action":"update"}	\N	\N
39	47	directus_permissions	10	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workout_exercises","action":"delete"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workout_exercises","action":"delete"}	\N	\N
40	48	directus_permissions	11	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workout_sets","action":"create"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workout_sets","action":"create"}	\N	\N
41	49	directus_permissions	12	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workout_sets","action":"read"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workout_sets","action":"read"}	\N	\N
42	50	directus_permissions	13	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workout_sets","action":"update"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workout_sets","action":"update"}	\N	\N
43	51	directus_permissions	14	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workout_sets","action":"delete"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workout_sets","action":"delete"}	\N	\N
44	52	directus_permissions	15	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workouts","action":"create"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workouts","action":"create"}	\N	\N
45	53	directus_permissions	16	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workouts","action":"read"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workouts","action":"read"}	\N	\N
46	54	directus_permissions	17	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workouts","action":"update"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workouts","action":"update"}	\N	\N
47	55	directus_permissions	18	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workouts","action":"delete"}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"workouts","action":"delete"}	\N	\N
48	57	users	3	{"username":"123"}	{"username":"123"}	\N	\N
49	58	workouts	1	{"user_id":"3","workout_date":"2025-11-05"}	{"user_id":"3","workout_date":"2025-11-05"}	\N	\N
50	59	workout_exercises	1	{"workout_id":"1","directus_exercise_id":1}	{"workout_id":"1","directus_exercise_id":1}	\N	\N
51	60	workouts	2	{"user_id":"3","workout_date":"2025-11-04"}	{"user_id":"3","workout_date":"2025-11-04"}	\N	\N
52	61	workout_exercises	2	{"workout_id":"2","directus_exercise_id":"1"}	{"workout_id":"2","directus_exercise_id":"1"}	\N	\N
53	62	workout_sets	1	{"workout_exercise_id":"2","reps":10,"weight":12,"set_order":1}	{"workout_exercise_id":"2","reps":10,"weight":12,"set_order":1}	\N	\N
54	63	workout_exercises	3	{"workout_id":"2","directus_exercise_id":"2"}	{"workout_id":"2","directus_exercise_id":"2"}	\N	\N
55	64	workout_exercises	4	{"workout_id":"2","directus_exercise_id":"1"}	{"workout_id":"2","directus_exercise_id":"1"}	\N	\N
56	65	workout_sets	2	{"workout_exercise_id":"4","reps":10,"weight":12,"set_order":1}	{"workout_exercise_id":"4","reps":10,"weight":12,"set_order":1}	\N	\N
57	66	workout_exercises	5	{"workout_id":"2","directus_exercise_id":"2"}	{"workout_id":"2","directus_exercise_id":"2"}	\N	\N
58	67	workout_exercises	6	{"workout_id":"1","directus_exercise_id":1}	{"workout_id":"1","directus_exercise_id":1}	\N	\N
59	68	workout_exercises	7	{"workout_id":"1","directus_exercise_id":1}	{"workout_id":"1","directus_exercise_id":1}	\N	\N
60	69	workouts	3	{"user_id":"3","workout_date":"2025-11-06"}	{"user_id":"3","workout_date":"2025-11-06"}	\N	\N
61	70	workout_exercises	8	{"workout_id":"3","directus_exercise_id":"1"}	{"workout_id":"3","directus_exercise_id":"1"}	\N	\N
62	71	workout_sets	3	{"workout_exercise_id":"8","reps":10,"weight":12,"set_order":1}	{"workout_exercise_id":"8","reps":10,"weight":12,"set_order":1}	\N	\N
63	72	workouts	4	{"user_id":"3","workout_date":"2025-11-07"}	{"user_id":"3","workout_date":"2025-11-07"}	\N	\N
64	73	workout_exercises	9	{"workout_id":"4","directus_exercise_id":"2"}	{"workout_id":"4","directus_exercise_id":"2"}	\N	\N
65	74	workout_sets	4	{"workout_exercise_id":"9","reps":10,"weight":1,"set_order":1}	{"workout_exercise_id":"9","reps":10,"weight":1,"set_order":1}	\N	\N
66	75	workout_exercises	10	{"workout_id":1,"directus_exercise_id":"1"}	{"workout_id":1,"directus_exercise_id":"1"}	\N	\N
67	76	workout_exercises	11	{"workout_id":"4","directus_exercise_id":"2"}	{"workout_id":"4","directus_exercise_id":"2"}	\N	\N
68	77	workouts	5	{"user_id":"3","workout_date":"2025-11-08"}	{"user_id":"3","workout_date":"2025-11-08"}	\N	\N
69	78	workout_exercises	12	{"workout_id":"5","directus_exercise_id":"2"}	{"workout_id":"5","directus_exercise_id":"2"}	\N	\N
70	79	workout_sets	5	{"workout_exercise_id":"12","reps":10,"weight":23,"set_order":1}	{"workout_exercise_id":"12","reps":10,"weight":23,"set_order":1}	\N	\N
71	80	workout_exercises	13	{"workout_id":"5","directus_exercise_id":"2"}	{"workout_id":"5","directus_exercise_id":"2"}	\N	\N
72	81	workout_sets	6	{"workout_exercise_id":"13","reps":10,"weight":23,"set_order":1}	{"workout_exercise_id":"13","reps":10,"weight":23,"set_order":1}	\N	\N
73	82	workout_exercises	14	{"workout_id":"5","directus_exercise_id":"2"}	{"workout_id":"5","directus_exercise_id":"2"}	\N	\N
74	83	workout_sets	7	{"workout_exercise_id":"14","reps":10,"weight":23,"set_order":1}	{"workout_exercise_id":"14","reps":10,"weight":23,"set_order":1}	\N	\N
75	84	workout_exercises	15	{"workout_id":"5","directus_exercise_id":"2"}	{"workout_id":"5","directus_exercise_id":"2"}	\N	\N
76	85	workout_sets	8	{"workout_exercise_id":"15","reps":10,"weight":23,"set_order":1}	{"workout_exercise_id":"15","reps":10,"weight":23,"set_order":1}	\N	\N
77	86	workouts	6	{"user_id":"3","workout_date":"2025-11-09"}	{"user_id":"3","workout_date":"2025-11-09"}	\N	\N
78	87	workout_exercises	16	{"workout_id":"6","directus_exercise_id":"2"}	{"workout_id":"6","directus_exercise_id":"2"}	\N	\N
79	88	workout_sets	9	{"workout_exercise_id":"16","reps":10,"weight":1,"set_order":1}	{"workout_exercise_id":"16","reps":10,"weight":1,"set_order":1}	\N	\N
80	89	workout_exercises	17	{"workout_id":"6","directus_exercise_id":"2"}	{"workout_id":"6","directus_exercise_id":"2"}	\N	\N
81	90	workout_sets	10	{"workout_exercise_id":"17","reps":10,"weight":"1.00","set_order":1}	{"workout_exercise_id":"17","reps":10,"weight":"1.00","set_order":1}	\N	\N
82	91	workout_sets	11	{"workout_exercise_id":"17","reps":10,"weight":2,"set_order":2}	{"workout_exercise_id":"17","reps":10,"weight":2,"set_order":2}	\N	\N
83	92	workout_exercises	18	{"workout_id":"6","directus_exercise_id":"2"}	{"workout_id":"6","directus_exercise_id":"2"}	\N	\N
84	93	workout_sets	12	{"workout_exercise_id":"18","reps":10,"weight":1,"set_order":1}	{"workout_exercise_id":"18","reps":10,"weight":1,"set_order":1}	\N	\N
85	94	workout_exercises	19	{"workout_id":"6","directus_exercise_id":"2"}	{"workout_id":"6","directus_exercise_id":"2"}	\N	\N
86	95	workout_sets	13	{"workout_exercise_id":"19","reps":10,"weight":"1.00","set_order":1}	{"workout_exercise_id":"19","reps":10,"weight":"1.00","set_order":1}	\N	\N
87	96	workout_sets	14	{"workout_exercise_id":"19","reps":10,"weight":2,"set_order":2}	{"workout_exercise_id":"19","reps":10,"weight":2,"set_order":2}	\N	\N
88	97	workout_exercises	20	{"workout_id":"6","directus_exercise_id":"2"}	{"workout_id":"6","directus_exercise_id":"2"}	\N	\N
89	98	workout_sets	15	{"workout_exercise_id":"20","reps":10,"weight":"1.00","set_order":1}	{"workout_exercise_id":"20","reps":10,"weight":"1.00","set_order":1}	\N	\N
90	99	workout_sets	16	{"workout_exercise_id":"20","reps":10,"weight":2,"set_order":2}	{"workout_exercise_id":"20","reps":10,"weight":2,"set_order":2}	\N	\N
91	100	workout_sets	17	{"workout_exercise_id":"20","reps":10,"weight":3,"set_order":3}	{"workout_exercise_id":"20","reps":10,"weight":3,"set_order":3}	\N	\N
92	101	workout_exercises	21	{"workout_id":"6","directus_exercise_id":"2"}	{"workout_id":"6","directus_exercise_id":"2"}	\N	\N
93	102	workout_sets	18	{"workout_exercise_id":"21","reps":10,"weight":"1.00","set_order":1}	{"workout_exercise_id":"21","reps":10,"weight":"1.00","set_order":1}	\N	\N
94	103	workout_sets	19	{"workout_exercise_id":"21","reps":10,"weight":2,"set_order":2}	{"workout_exercise_id":"21","reps":10,"weight":2,"set_order":2}	\N	\N
95	104	workout_sets	20	{"workout_exercise_id":"21","reps":10,"weight":3,"set_order":3}	{"workout_exercise_id":"21","reps":10,"weight":3,"set_order":3}	\N	\N
96	105	workout_exercises	22	{"workout_id":"6","directus_exercise_id":"5"}	{"workout_id":"6","directus_exercise_id":"5"}	\N	\N
97	106	workout_sets	21	{"workout_exercise_id":"22","reps":10,"weight":1,"set_order":1}	{"workout_exercise_id":"22","reps":10,"weight":1,"set_order":1}	\N	\N
98	107	workout_exercises	23	{"workout_id":"6","directus_exercise_id":"2"}	{"workout_id":"6","directus_exercise_id":"2"}	\N	\N
99	108	workout_sets	22	{"workout_exercise_id":"23","reps":10,"weight":1,"set_order":1}	{"workout_exercise_id":"23","reps":10,"weight":1,"set_order":1}	\N	\N
100	109	workout_sets	23	{"workout_exercise_id":"23","reps":10,"weight":2,"set_order":2}	{"workout_exercise_id":"23","reps":10,"weight":2,"set_order":2}	\N	\N
101	110	workout_sets	24	{"workout_exercise_id":"23","reps":10,"weight":3,"set_order":3}	{"workout_exercise_id":"23","reps":10,"weight":3,"set_order":3}	\N	\N
102	111	workout_exercises	24	{"workout_id":"6","directus_exercise_id":"5"}	{"workout_id":"6","directus_exercise_id":"5"}	\N	\N
103	112	workout_sets	25	{"workout_exercise_id":"24","reps":10,"weight":1,"set_order":1}	{"workout_exercise_id":"24","reps":10,"weight":1,"set_order":1}	\N	\N
104	113	workout_exercises	25	{"workout_id":"6","directus_exercise_id":"2"}	{"workout_id":"6","directus_exercise_id":"2"}	\N	\N
105	114	workout_sets	26	{"workout_exercise_id":"25","reps":10,"weight":1,"set_order":1}	{"workout_exercise_id":"25","reps":10,"weight":1,"set_order":1}	\N	\N
106	115	workout_sets	27	{"workout_exercise_id":"25","reps":10,"weight":2,"set_order":2}	{"workout_exercise_id":"25","reps":10,"weight":2,"set_order":2}	\N	\N
107	116	workout_sets	28	{"workout_exercise_id":"25","reps":10,"weight":3,"set_order":3}	{"workout_exercise_id":"25","reps":10,"weight":3,"set_order":3}	\N	\N
108	117	workout_exercises	26	{"workout_id":"6","directus_exercise_id":"5"}	{"workout_id":"6","directus_exercise_id":"5"}	\N	\N
109	118	workout_sets	29	{"workout_exercise_id":"26","reps":10,"weight":1,"set_order":1}	{"workout_exercise_id":"26","reps":10,"weight":1,"set_order":1}	\N	\N
110	119	workout_exercises	27	{"workout_id":"6","directus_exercise_id":"2"}	{"workout_id":"6","directus_exercise_id":"2"}	\N	\N
111	120	workout_sets	30	{"workout_exercise_id":"27","reps":10,"weight":1,"set_order":1}	{"workout_exercise_id":"27","reps":10,"weight":1,"set_order":1}	\N	\N
112	121	workout_exercises	28	{"workout_id":"6","directus_exercise_id":"2"}	{"workout_id":"6","directus_exercise_id":"2"}	\N	\N
113	122	workout_sets	31	{"workout_exercise_id":"28","reps":10,"weight":1,"set_order":1}	{"workout_exercise_id":"28","reps":10,"weight":1,"set_order":1}	\N	\N
114	123	workouts	7	{"user_id":"3","workout_date":"2025-11-10"}	{"user_id":"3","workout_date":"2025-11-10"}	\N	\N
115	124	workout_exercises	29	{"workout_id":"7","directus_exercise_id":"3"}	{"workout_id":"7","directus_exercise_id":"3"}	\N	\N
116	125	workout_sets	32	{"workout_exercise_id":"29","reps":1,"weight":1,"set_order":1}	{"workout_exercise_id":"29","reps":1,"weight":1,"set_order":1}	\N	\N
117	126	workout_exercises	30	{"workout_id":"7","directus_exercise_id":"3"}	{"workout_id":"7","directus_exercise_id":"3"}	\N	\N
118	127	workout_sets	33	{"workout_exercise_id":"30","reps":1,"weight":1,"set_order":1}	{"workout_exercise_id":"30","reps":1,"weight":1,"set_order":1}	\N	\N
119	128	workout_sets	34	{"workout_exercise_id":"30","reps":1,"weight":2,"set_order":2}	{"workout_exercise_id":"30","reps":1,"weight":2,"set_order":2}	\N	\N
120	129	workout_exercises	31	{"workout_id":"7","directus_exercise_id":"3"}	{"workout_id":"7","directus_exercise_id":"3"}	\N	\N
121	130	workout_sets	35	{"workout_exercise_id":"31","reps":1,"weight":1,"set_order":1}	{"workout_exercise_id":"31","reps":1,"weight":1,"set_order":1}	\N	\N
122	131	workout_sets	36	{"workout_exercise_id":"31","reps":1,"weight":2,"set_order":2}	{"workout_exercise_id":"31","reps":1,"weight":2,"set_order":2}	\N	\N
123	132	workout_sets	37	{"workout_exercise_id":"31","reps":1,"weight":3,"set_order":3}	{"workout_exercise_id":"31","reps":1,"weight":3,"set_order":3}	\N	\N
124	133	workout_exercises	32	{"workout_id":"7","directus_exercise_id":"3"}	{"workout_id":"7","directus_exercise_id":"3"}	\N	\N
125	134	workout_sets	38	{"workout_exercise_id":"32","reps":1,"weight":1,"set_order":1}	{"workout_exercise_id":"32","reps":1,"weight":1,"set_order":1}	\N	\N
126	135	workout_sets	39	{"workout_exercise_id":"32","reps":1,"weight":2,"set_order":2}	{"workout_exercise_id":"32","reps":1,"weight":2,"set_order":2}	\N	\N
127	136	workout_sets	40	{"workout_exercise_id":"32","reps":1,"weight":3,"set_order":3}	{"workout_exercise_id":"32","reps":1,"weight":3,"set_order":3}	\N	\N
128	137	workout_exercises	33	{"workout_id":"7","directus_exercise_id":"3"}	{"workout_id":"7","directus_exercise_id":"3"}	\N	\N
129	138	workout_sets	41	{"workout_exercise_id":"33","reps":1,"weight":"1.00","set_order":1}	{"workout_exercise_id":"33","reps":1,"weight":"1.00","set_order":1}	\N	\N
130	139	workout_sets	42	{"workout_exercise_id":"33","reps":1,"weight":"2.00","set_order":2}	{"workout_exercise_id":"33","reps":1,"weight":"2.00","set_order":2}	\N	\N
131	140	workout_sets	43	{"workout_exercise_id":"33","reps":1,"weight":"3.00","set_order":3}	{"workout_exercise_id":"33","reps":1,"weight":"3.00","set_order":3}	\N	\N
132	141	workout_sets	44	{"workout_exercise_id":"33","reps":10,"weight":4,"set_order":4}	{"workout_exercise_id":"33","reps":10,"weight":4,"set_order":4}	\N	\N
133	142	workout_exercises	34	{"workout_id":"7","directus_exercise_id":"3"}	{"workout_id":"7","directus_exercise_id":"3"}	\N	\N
134	143	workout_sets	45	{"workout_exercise_id":"34","reps":1,"weight":"1.00","set_order":1}	{"workout_exercise_id":"34","reps":1,"weight":"1.00","set_order":1}	\N	\N
135	144	workout_sets	46	{"workout_exercise_id":"34","reps":1,"weight":"2.00","set_order":2}	{"workout_exercise_id":"34","reps":1,"weight":"2.00","set_order":2}	\N	\N
136	145	workout_sets	47	{"workout_exercise_id":"34","reps":1,"weight":"3.00","set_order":3}	{"workout_exercise_id":"34","reps":1,"weight":"3.00","set_order":3}	\N	\N
137	146	workout_sets	48	{"workout_exercise_id":"34","reps":10,"weight":4,"set_order":4}	{"workout_exercise_id":"34","reps":10,"weight":4,"set_order":4}	\N	\N
138	147	workout_exercises	35	{"workout_id":"7","directus_exercise_id":"4"}	{"workout_id":"7","directus_exercise_id":"4"}	\N	\N
139	148	workout_sets	49	{"workout_exercise_id":"35","reps":1,"weight":1,"set_order":1}	{"workout_exercise_id":"35","reps":1,"weight":1,"set_order":1}	\N	\N
140	149	workout_exercises	36	{"workout_id":"7","directus_exercise_id":"3"}	{"workout_id":"7","directus_exercise_id":"3"}	\N	\N
141	150	workout_sets	50	{"workout_exercise_id":"36","reps":1,"weight":"1.00","set_order":1}	{"workout_exercise_id":"36","reps":1,"weight":"1.00","set_order":1}	\N	\N
142	151	workout_sets	51	{"workout_exercise_id":"36","reps":1,"weight":"2.00","set_order":2}	{"workout_exercise_id":"36","reps":1,"weight":"2.00","set_order":2}	\N	\N
143	152	workout_sets	52	{"workout_exercise_id":"36","reps":1,"weight":"3.00","set_order":3}	{"workout_exercise_id":"36","reps":1,"weight":"3.00","set_order":3}	\N	\N
144	153	workout_sets	53	{"workout_exercise_id":"36","reps":10,"weight":4,"set_order":4}	{"workout_exercise_id":"36","reps":10,"weight":4,"set_order":4}	\N	\N
145	154	workout_exercises	37	{"workout_id":"7","directus_exercise_id":"4"}	{"workout_id":"7","directus_exercise_id":"4"}	\N	\N
146	155	workout_sets	54	{"workout_exercise_id":"37","reps":1,"weight":1,"set_order":1}	{"workout_exercise_id":"37","reps":1,"weight":1,"set_order":1}	\N	\N
147	156	workout_sets	55	{"workout_exercise_id":"37","reps":1,"weight":2,"set_order":2}	{"workout_exercise_id":"37","reps":1,"weight":2,"set_order":2}	\N	\N
148	157	workout_exercises	38	{"workout_id":"7","directus_exercise_id":"3"}	{"workout_id":"7","directus_exercise_id":"3"}	\N	\N
149	158	workout_sets	56	{"workout_exercise_id":"38","reps":1,"weight":"1.00","set_order":1}	{"workout_exercise_id":"38","reps":1,"weight":"1.00","set_order":1}	\N	\N
150	159	workout_sets	57	{"workout_exercise_id":"38","reps":1,"weight":"2.00","set_order":2}	{"workout_exercise_id":"38","reps":1,"weight":"2.00","set_order":2}	\N	\N
151	160	workout_sets	58	{"workout_exercise_id":"38","reps":1,"weight":"3.00","set_order":3}	{"workout_exercise_id":"38","reps":1,"weight":"3.00","set_order":3}	\N	\N
152	161	workout_sets	59	{"workout_exercise_id":"38","reps":10,"weight":4,"set_order":4}	{"workout_exercise_id":"38","reps":10,"weight":4,"set_order":4}	\N	\N
153	162	workout_exercises	39	{"workout_id":"7","directus_exercise_id":"4"}	{"workout_id":"7","directus_exercise_id":"4"}	\N	\N
154	163	workout_sets	60	{"workout_exercise_id":"39","reps":1,"weight":1,"set_order":1}	{"workout_exercise_id":"39","reps":1,"weight":1,"set_order":1}	\N	\N
155	164	workout_sets	61	{"workout_exercise_id":"39","reps":1,"weight":2,"set_order":2}	{"workout_exercise_id":"39","reps":1,"weight":2,"set_order":2}	\N	\N
156	165	workout_sets	62	{"workout_exercise_id":"39","reps":1,"weight":3,"set_order":3}	{"workout_exercise_id":"39","reps":1,"weight":3,"set_order":3}	\N	\N
157	166	workout_exercises	40	{"workout_id":"7","directus_exercise_id":"3"}	{"workout_id":"7","directus_exercise_id":"3"}	\N	\N
158	167	workout_sets	63	{"workout_exercise_id":"40","reps":1,"weight":"1.00","set_order":1}	{"workout_exercise_id":"40","reps":1,"weight":"1.00","set_order":1}	\N	\N
159	168	workout_sets	64	{"workout_exercise_id":"40","reps":1,"weight":"2.00","set_order":2}	{"workout_exercise_id":"40","reps":1,"weight":"2.00","set_order":2}	\N	\N
160	169	workout_sets	65	{"workout_exercise_id":"40","reps":1,"weight":"3.00","set_order":3}	{"workout_exercise_id":"40","reps":1,"weight":"3.00","set_order":3}	\N	\N
161	170	workout_sets	66	{"workout_exercise_id":"40","reps":10,"weight":4,"set_order":4}	{"workout_exercise_id":"40","reps":10,"weight":4,"set_order":4}	\N	\N
162	171	workout_exercises	41	{"workout_id":"7","directus_exercise_id":"4"}	{"workout_id":"7","directus_exercise_id":"4"}	\N	\N
163	172	workout_sets	67	{"workout_exercise_id":"41","reps":1,"weight":1,"set_order":1}	{"workout_exercise_id":"41","reps":1,"weight":1,"set_order":1}	\N	\N
164	173	workout_sets	68	{"workout_exercise_id":"41","reps":1,"weight":2,"set_order":2}	{"workout_exercise_id":"41","reps":1,"weight":2,"set_order":2}	\N	\N
165	174	workout_sets	69	{"workout_exercise_id":"41","reps":1,"weight":3,"set_order":3}	{"workout_exercise_id":"41","reps":1,"weight":3,"set_order":3}	\N	\N
166	175	workout_exercises	42	{"workout_id":"1","directus_exercise_id":"1"}	{"workout_id":"1","directus_exercise_id":"1"}	\N	\N
167	176	workout_exercises	43	{"workout_id":"7","directus_exercise_id":"3"}	{"workout_id":"7","directus_exercise_id":"3"}	\N	\N
168	177	workout_sets	70	{"workout_exercise_id":"43","reps":1,"weight":1,"set_order":1}	{"workout_exercise_id":"43","reps":1,"weight":1,"set_order":1}	\N	\N
169	178	workout_sets	71	{"workout_exercise_id":"43","reps":1,"weight":2,"set_order":2}	{"workout_exercise_id":"43","reps":1,"weight":2,"set_order":2}	\N	\N
170	179	workout_sets	72	{"workout_exercise_id":"43","reps":1,"weight":3,"set_order":3}	{"workout_exercise_id":"43","reps":1,"weight":3,"set_order":3}	\N	\N
171	180	workouts	8	{"user_id":"3","workout_date":"2025-11-11"}	{"user_id":"3","workout_date":"2025-11-11"}	\N	\N
172	181	workout_exercises	44	{"workout_id":"8","directus_exercise_id":"1"}	{"workout_id":"8","directus_exercise_id":"1"}	\N	\N
173	182	workout_sets	73	{"workout_exercise_id":"44","reps":10,"weight":1,"set_order":1}	{"workout_exercise_id":"44","reps":10,"weight":1,"set_order":1}	\N	\N
174	183	workout_exercises	45	{"workout_id":"8","directus_exercise_id":"1"}	{"workout_id":"8","directus_exercise_id":"1"}	\N	\N
175	184	workout_sets	74	{"workout_exercise_id":"45","reps":10,"weight":1,"set_order":1}	{"workout_exercise_id":"45","reps":10,"weight":1,"set_order":1}	\N	\N
176	185	workout_sets	75	{"workout_exercise_id":"45","reps":10,"weight":2,"set_order":2}	{"workout_exercise_id":"45","reps":10,"weight":2,"set_order":2}	\N	\N
177	186	workout_exercises	46	{"workout_id":"8","directus_exercise_id":"1"}	{"workout_id":"8","directus_exercise_id":"1"}	\N	\N
178	187	workout_sets	76	{"workout_exercise_id":"46","reps":10,"weight":1,"set_order":1}	{"workout_exercise_id":"46","reps":10,"weight":1,"set_order":1}	\N	\N
179	188	workout_sets	77	{"workout_exercise_id":"46","reps":10,"weight":2,"set_order":2}	{"workout_exercise_id":"46","reps":10,"weight":2,"set_order":2}	\N	\N
180	189	workout_exercises	47	{"workout_id":"8","directus_exercise_id":"1"}	{"workout_id":"8","directus_exercise_id":"1"}	\N	\N
181	190	workout_sets	78	{"workout_exercise_id":"47","reps":10,"weight":"1.00","set_order":1}	{"workout_exercise_id":"47","reps":10,"weight":"1.00","set_order":1}	\N	\N
182	191	workout_sets	79	{"workout_exercise_id":"47","reps":10,"weight":"2.00","set_order":2}	{"workout_exercise_id":"47","reps":10,"weight":"2.00","set_order":2}	\N	\N
183	192	workout_exercises	48	{"workout_id":"8","directus_exercise_id":"4"}	{"workout_id":"8","directus_exercise_id":"4"}	\N	\N
184	193	workout_sets	80	{"workout_exercise_id":"48","reps":1,"weight":1,"set_order":1}	{"workout_exercise_id":"48","reps":1,"weight":1,"set_order":1}	\N	\N
185	194	workout_exercises	49	{"workout_id":"8","directus_exercise_id":"1"}	{"workout_id":"8","directus_exercise_id":"1"}	\N	\N
186	195	workout_sets	81	{"workout_exercise_id":"49","reps":10,"weight":"1.00","set_order":1}	{"workout_exercise_id":"49","reps":10,"weight":"1.00","set_order":1}	\N	\N
187	196	workout_sets	82	{"workout_exercise_id":"49","reps":10,"weight":"2.00","set_order":2}	{"workout_exercise_id":"49","reps":10,"weight":"2.00","set_order":2}	\N	\N
188	197	workout_exercises	50	{"workout_id":"8","directus_exercise_id":"4"}	{"workout_id":"8","directus_exercise_id":"4"}	\N	\N
189	198	workout_sets	83	{"workout_exercise_id":"50","reps":1,"weight":1,"set_order":1}	{"workout_exercise_id":"50","reps":1,"weight":1,"set_order":1}	\N	\N
190	199	workout_sets	84	{"workout_exercise_id":"50","reps":1,"weight":2,"set_order":2}	{"workout_exercise_id":"50","reps":1,"weight":2,"set_order":2}	\N	\N
191	200	workout_exercises	51	{"workout_id":"8","directus_exercise_id":"1"}	{"workout_id":"8","directus_exercise_id":"1"}	\N	\N
192	201	workout_sets	85	{"workout_exercise_id":"51","reps":10,"weight":"1.00","set_order":1}	{"workout_exercise_id":"51","reps":10,"weight":"1.00","set_order":1}	\N	\N
193	202	workout_sets	86	{"workout_exercise_id":"51","reps":10,"weight":"2.00","set_order":2}	{"workout_exercise_id":"51","reps":10,"weight":"2.00","set_order":2}	\N	\N
194	203	workout_exercises	52	{"workout_id":"8","directus_exercise_id":"4"}	{"workout_id":"8","directus_exercise_id":"4"}	\N	\N
195	204	workout_sets	87	{"workout_exercise_id":"52","reps":1,"weight":1,"set_order":1}	{"workout_exercise_id":"52","reps":1,"weight":1,"set_order":1}	\N	\N
196	205	workout_sets	88	{"workout_exercise_id":"52","reps":1,"weight":2,"set_order":2}	{"workout_exercise_id":"52","reps":1,"weight":2,"set_order":2}	\N	\N
197	206	workout_exercises	53	{"workout_id":"8","directus_exercise_id":"1"}	{"workout_id":"8","directus_exercise_id":"1"}	\N	\N
198	207	workout_sets	89	{"workout_exercise_id":"53","reps":10,"weight":"1.00","set_order":1}	{"workout_exercise_id":"53","reps":10,"weight":"1.00","set_order":1}	\N	\N
199	208	workout_sets	90	{"workout_exercise_id":"53","reps":10,"weight":"2.00","set_order":2}	{"workout_exercise_id":"53","reps":10,"weight":"2.00","set_order":2}	\N	\N
200	209	workout_exercises	54	{"workout_id":"8","directus_exercise_id":"4"}	{"workout_id":"8","directus_exercise_id":"4"}	\N	\N
201	210	workout_sets	91	{"workout_exercise_id":"54","reps":1,"weight":"1.00","set_order":1}	{"workout_exercise_id":"54","reps":1,"weight":"1.00","set_order":1}	\N	\N
202	211	workout_sets	92	{"workout_exercise_id":"54","reps":1,"weight":"2.00","set_order":2}	{"workout_exercise_id":"54","reps":1,"weight":"2.00","set_order":2}	\N	\N
203	212	workout_exercises	55	{"workout_id":"8","directus_exercise_id":"1"}	{"workout_id":"8","directus_exercise_id":"1"}	\N	\N
204	213	workout_sets	93	{"workout_exercise_id":"55","reps":10,"weight":"1.00","set_order":1}	{"workout_exercise_id":"55","reps":10,"weight":"1.00","set_order":1}	\N	\N
205	214	workout_sets	94	{"workout_exercise_id":"55","reps":10,"weight":"2.00","set_order":2}	{"workout_exercise_id":"55","reps":10,"weight":"2.00","set_order":2}	\N	\N
206	215	workout_exercises	56	{"workout_id":"8","directus_exercise_id":"4"}	{"workout_id":"8","directus_exercise_id":"4"}	\N	\N
207	216	workout_sets	95	{"workout_exercise_id":"56","reps":1,"weight":"1.00","set_order":1}	{"workout_exercise_id":"56","reps":1,"weight":"1.00","set_order":1}	\N	\N
208	217	workout_sets	96	{"workout_exercise_id":"56","reps":1,"weight":"2.00","set_order":2}	{"workout_exercise_id":"56","reps":1,"weight":"2.00","set_order":2}	\N	\N
209	218	users	4	{"username":"test"}	{"username":"test"}	\N	\N
210	219	workouts	9	{"user_id":"4","workout_date":"2025-11-05"}	{"user_id":"4","workout_date":"2025-11-05"}	\N	\N
211	220	workout_exercises	57	{"workout_id":"9","directus_exercise_id":"1"}	{"workout_id":"9","directus_exercise_id":"1"}	\N	\N
212	221	workout_sets	97	{"workout_exercise_id":"57","reps":10,"weight":23,"set_order":1}	{"workout_exercise_id":"57","reps":10,"weight":23,"set_order":1}	\N	\N
213	222	workout_exercises	58	{"workout_id":"9","directus_exercise_id":"2"}	{"workout_id":"9","directus_exercise_id":"2"}	\N	\N
214	223	workout_exercises	59	{"workout_id":"9","directus_exercise_id":"1"}	{"workout_id":"9","directus_exercise_id":"1"}	\N	\N
215	224	workout_sets	98	{"workout_exercise_id":"59","reps":10,"weight":23,"set_order":1}	{"workout_exercise_id":"59","reps":10,"weight":23,"set_order":1}	\N	\N
216	225	workout_exercises	60	{"workout_id":"9","directus_exercise_id":"2"}	{"workout_id":"9","directus_exercise_id":"2"}	\N	\N
217	226	workout_sets	99	{"workout_exercise_id":"60","reps":10,"weight":32,"set_order":1}	{"workout_exercise_id":"60","reps":10,"weight":32,"set_order":1}	\N	\N
218	227	workout_exercises	61	{"workout_id":"9","directus_exercise_id":"1"}	{"workout_id":"9","directus_exercise_id":"1"}	\N	\N
219	228	workout_sets	100	{"workout_exercise_id":"61","reps":10,"weight":"23.00","set_order":1}	{"workout_exercise_id":"61","reps":10,"weight":"23.00","set_order":1}	\N	\N
220	229	workout_exercises	62	{"workout_id":"9","directus_exercise_id":"1"}	{"workout_id":"9","directus_exercise_id":"1"}	\N	\N
221	230	workout_sets	101	{"workout_exercise_id":"62","reps":10,"weight":"23.00","set_order":1}	{"workout_exercise_id":"62","reps":10,"weight":"23.00","set_order":1}	\N	\N
222	231	workout_exercises	63	{"workout_id":"9","directus_exercise_id":"2"}	{"workout_id":"9","directus_exercise_id":"2"}	\N	\N
223	232	workout_sets	102	{"workout_exercise_id":"63","reps":10,"weight":"32.00","set_order":1}	{"workout_exercise_id":"63","reps":10,"weight":"32.00","set_order":1}	\N	\N
224	233	workout_exercises	64	{"workout_id":"9","directus_exercise_id":"1"}	{"workout_id":"9","directus_exercise_id":"1"}	\N	\N
225	234	workout_sets	103	{"workout_exercise_id":"64","reps":10,"weight":"23.00","set_order":1}	{"workout_exercise_id":"64","reps":10,"weight":"23.00","set_order":1}	\N	\N
226	235	workout_exercises	65	{"workout_id":"9","directus_exercise_id":"2"}	{"workout_id":"9","directus_exercise_id":"2"}	\N	\N
227	236	workout_sets	104	{"workout_exercise_id":"65","reps":10,"weight":"32.00","set_order":1}	{"workout_exercise_id":"65","reps":10,"weight":"32.00","set_order":1}	\N	\N
228	237	workout_exercises	66	{"workout_id":"9","directus_exercise_id":"1"}	{"workout_id":"9","directus_exercise_id":"1"}	\N	\N
229	238	workout_sets	105	{"workout_exercise_id":"66","reps":10,"weight":"23.00","set_order":1}	{"workout_exercise_id":"66","reps":10,"weight":"23.00","set_order":1}	\N	\N
230	239	workout_exercises	67	{"workout_id":"9","directus_exercise_id":"2"}	{"workout_id":"9","directus_exercise_id":"2"}	\N	\N
231	240	workout_sets	106	{"workout_exercise_id":"67","reps":10,"weight":"32.00","set_order":1}	{"workout_exercise_id":"67","reps":10,"weight":"32.00","set_order":1}	\N	\N
\.


--
-- Data for Name: directus_roles; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_roles (id, name, icon, description, parent) FROM stdin;
0805903a-a957-4007-967d-6a1d316bb4cc	Administrator	verified	$t:admin_description	\N
\.


--
-- Data for Name: directus_sessions; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_sessions (token, "user", expires, ip, user_agent, share, origin, next_token) FROM stdin;
KYNFaJj0QVFfiq85TpkfXCrbb51cGfb7AqSqhGcFSE3TyHrWAaoUJf8lG2lECMS2	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-10 19:25:56.331+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	http://localhost:8055	\N
LR4Yijugq8FcjMqlybt4N11Ecd2G_Ju_OyZz5RrS-q8J0SUBWBugUMuSLYLiIEEa	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-10 19:33:40.057+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	http://localhost:8055	\N
w4Ltq4eLGlYDsEZSrVCulI8gVkgAartrtm4DKnDqRkDEy5QduZUmSNJTE7bC8oqE	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-10 19:50:07.156+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	http://localhost:8055	\N
8imo92MiTVOV1zKNFHatP2QM4DSmyn_DSINtixa7Jq9lpLuOVcwhCa0Yymv1NUR2	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-10 20:25:38.593+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	http://localhost:8055	\N
lVaJrWg8uufytUSCHGwy6VkFXDp6KWd4-iT_y0_6wvznjJbzzJiV7Ir-7o1-ns9t	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-11 08:13:02.768+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	http://localhost:8055	\N
9v_6Q46QEJ4IV4Ej4pcaxccFcKT1U_IrG6aMnol1vjdU3fKncbw9d9masKdLo1pl	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-04 14:07:26.692+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	http://localhost:8055	Lnx11XlFJwc4eliTKUsGe_tSRcgRD_PwY_fUx1vpL5kfmC7XFDI23eRHcov4aP30
Lnx11XlFJwc4eliTKUsGe_tSRcgRD_PwY_fUx1vpL5kfmC7XFDI23eRHcov4aP30	d6d9c8b0-2255-4908-b25d-50cd46b714dd	2025-11-05 14:07:16.691+00	192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	http://localhost:8055	\N
\.


--
-- Data for Name: directus_settings; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_settings (id, project_name, project_url, project_color, project_logo, public_foreground, public_background, public_note, auth_login_attempts, auth_password_policy, storage_asset_transform, storage_asset_presets, custom_css, storage_default_folder, basemaps, mapbox_key, module_bar, project_descriptor, default_language, custom_aspect_ratios, public_favicon, default_appearance, default_theme_light, theme_light_overrides, default_theme_dark, theme_dark_overrides, report_error_url, report_bug_url, report_feature_url, public_registration, public_registration_verify_email, public_registration_role, public_registration_email_filter, visual_editor_urls, accepted_terms, project_id, mcp_enabled, mcp_allow_deletes, mcp_prompts_collection, mcp_system_prompt_enabled, mcp_system_prompt) FROM stdin;
1	Directus	\N	#6644FF	\N	\N	\N	\N	25	\N	all	\N	\N	\N	\N	\N	\N	\N	en-US	\N	\N	auto	\N	\N	\N	\N	\N	\N	\N	f	t	\N	\N	\N	t	019a4b28-d9d7-76dc-9fcc-1ae3d127c220	f	f	\N	t	\N
\.


--
-- Data for Name: directus_shares; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_shares (id, name, collection, item, role, password, user_created, date_created, date_start, date_end, times_used, max_uses) FROM stdin;
\.


--
-- Data for Name: directus_translations; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_translations (id, language, key, value) FROM stdin;
\.


--
-- Data for Name: directus_users; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_users (id, first_name, last_name, email, password, location, title, description, tags, avatar, language, tfa_secret, status, role, token, last_access, last_page, provider, external_identifier, auth_data, email_notifications, appearance, theme_dark, theme_light, theme_light_overrides, theme_dark_overrides, text_direction) FROM stdin;
d6d9c8b0-2255-4908-b25d-50cd46b714dd	Admin	User	admin@example.com	$argon2id$v=19$m=65536,t=3,p=4$YJSTtRVlK9lpTNRRb6fjSg$BjreXRab+jLsWRp0ZDbEburSn3P3KwPoeyHzcQ8q8E0	\N	\N	\N	\N	\N	\N	\N	active	0805903a-a957-4007-967d-6a1d316bb4cc	\N	2025-11-04 14:07:16.697+00	/content/workout_exercises	default	\N	\N	t	\N	\N	\N	\N	\N	auto
\.


--
-- Data for Name: directus_versions; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_versions (id, key, name, collection, item, hash, date_created, date_updated, user_created, user_updated, delta) FROM stdin;
\.


--
-- Data for Name: directus_webhooks; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_webhooks (id, name, method, url, status, data, actions, collections, headers, was_active_before_deprecation, migrated_flow) FROM stdin;
\.


--
-- Data for Name: exercises; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.exercises (id, name, description, category) FROM stdin;
1	Жим лёжа	\N	1
2	Отжимания	\N	1
3	Подтягивания	\N	2
4	Тяга штанги в наклоне	\N	2
5	Становая тяга	\N	3
6	Жим над головой	\N	4
7	Разводки гантелей в стороны	\N	4
8	Сгибание рук со штангой	\N	5
9	Скручивания на фитболе	\N	6
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, telegram_id, username, first_name, last_name, created_at, updated_at) FROM stdin;
2	123	testuser	\N	\N	2025-11-04 13:17:03.660333+00	2025-11-04 13:17:03.660333+00
3	\N	123	\N	\N	2025-11-04 13:27:58.835058+00	2025-11-04 13:27:58.835058+00
4	\N	test	\N	\N	2025-11-04 14:07:11.346062+00	2025-11-04 14:07:11.346062+00
\.


--
-- Data for Name: workout_exercises; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workout_exercises (id, workout_id, directus_exercise_id, exercise_name, created_at, updated_at) FROM stdin;
57	9	1	\N	2025-11-04 14:09:09.76243+00	2025-11-04 14:09:09.76243+00
58	9	2	\N	2025-11-04 14:09:09.837438+00	2025-11-04 14:09:09.837438+00
59	9	1	\N	2025-11-04 14:09:13.706386+00	2025-11-04 14:09:13.706386+00
60	9	2	\N	2025-11-04 14:09:13.73065+00	2025-11-04 14:09:13.73065+00
61	9	1	\N	2025-11-04 14:09:50.290986+00	2025-11-04 14:09:50.290986+00
62	9	1	\N	2025-11-04 14:14:35.240869+00	2025-11-04 14:14:35.240869+00
63	9	2	\N	2025-11-04 14:14:35.299783+00	2025-11-04 14:14:35.299783+00
64	9	1	\N	2025-11-04 14:14:40.001168+00	2025-11-04 14:14:40.001168+00
65	9	2	\N	2025-11-04 14:14:40.026657+00	2025-11-04 14:14:40.026657+00
66	9	1	\N	2025-11-04 14:15:02.036889+00	2025-11-04 14:15:02.036889+00
67	9	2	\N	2025-11-04 14:15:02.065753+00	2025-11-04 14:15:02.065753+00
\.


--
-- Data for Name: workout_sets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workout_sets (id, workout_exercise_id, reps, weight, set_order, created_at, updated_at) FROM stdin;
97	57	10	23.00	1	2025-11-04 14:09:09.822398+00	2025-11-04 14:09:09.822398+00
98	59	10	23.00	1	2025-11-04 14:09:13.720684+00	2025-11-04 14:09:13.720684+00
99	60	10	32.00	1	2025-11-04 14:09:13.739864+00	2025-11-04 14:09:13.739864+00
100	61	10	23.00	1	2025-11-04 14:09:50.305932+00	2025-11-04 14:09:50.305932+00
101	62	10	23.00	1	2025-11-04 14:14:35.266362+00	2025-11-04 14:14:35.266362+00
102	63	10	32.00	1	2025-11-04 14:14:35.312752+00	2025-11-04 14:14:35.312752+00
103	64	10	23.00	1	2025-11-04 14:14:40.015376+00	2025-11-04 14:14:40.015376+00
104	65	10	32.00	1	2025-11-04 14:14:40.037317+00	2025-11-04 14:14:40.037317+00
105	66	10	23.00	1	2025-11-04 14:15:02.055895+00	2025-11-04 14:15:02.055895+00
106	67	10	32.00	1	2025-11-04 14:15:02.074972+00	2025-11-04 14:15:02.074972+00
\.


--
-- Data for Name: workouts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workouts (id, user_id, workout_date, created_at, updated_at) FROM stdin;
9	4	2025-11-05	2025-11-04 14:09:09.745319+00	2025-11-04 14:09:09.745319+00
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.categories_id_seq', 6, true);


--
-- Name: directus_activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.directus_activity_id_seq', 240, true);


--
-- Name: directus_fields_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.directus_fields_id_seq', 7, true);


--
-- Name: directus_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.directus_notifications_id_seq', 1, false);


--
-- Name: directus_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.directus_permissions_id_seq', 19, true);


--
-- Name: directus_presets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.directus_presets_id_seq', 2, true);


--
-- Name: directus_relations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.directus_relations_id_seq', 1, true);


--
-- Name: directus_revisions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.directus_revisions_id_seq', 231, true);


--
-- Name: directus_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.directus_settings_id_seq', 1, true);


--
-- Name: directus_webhooks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.directus_webhooks_id_seq', 1, false);


--
-- Name: exercises_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.exercises_id_seq', 9, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: workout_exercises_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.workout_exercises_id_seq', 67, true);


--
-- Name: workout_sets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.workout_sets_id_seq', 106, true);


--
-- Name: workouts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.workouts_id_seq', 9, true);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: directus_access directus_access_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_access
    ADD CONSTRAINT directus_access_pkey PRIMARY KEY (id);


--
-- Name: directus_activity directus_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_activity
    ADD CONSTRAINT directus_activity_pkey PRIMARY KEY (id);


--
-- Name: directus_collections directus_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_collections
    ADD CONSTRAINT directus_collections_pkey PRIMARY KEY (collection);


--
-- Name: directus_comments directus_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_comments
    ADD CONSTRAINT directus_comments_pkey PRIMARY KEY (id);


--
-- Name: directus_dashboards directus_dashboards_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_dashboards
    ADD CONSTRAINT directus_dashboards_pkey PRIMARY KEY (id);


--
-- Name: directus_extensions directus_extensions_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_extensions
    ADD CONSTRAINT directus_extensions_pkey PRIMARY KEY (id);


--
-- Name: directus_fields directus_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_fields
    ADD CONSTRAINT directus_fields_pkey PRIMARY KEY (id);


--
-- Name: directus_files directus_files_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_files
    ADD CONSTRAINT directus_files_pkey PRIMARY KEY (id);


--
-- Name: directus_flows directus_flows_operation_unique; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_flows
    ADD CONSTRAINT directus_flows_operation_unique UNIQUE (operation);


--
-- Name: directus_flows directus_flows_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_flows
    ADD CONSTRAINT directus_flows_pkey PRIMARY KEY (id);


--
-- Name: directus_folders directus_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_folders
    ADD CONSTRAINT directus_folders_pkey PRIMARY KEY (id);


--
-- Name: directus_migrations directus_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_migrations
    ADD CONSTRAINT directus_migrations_pkey PRIMARY KEY (version);


--
-- Name: directus_notifications directus_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_notifications
    ADD CONSTRAINT directus_notifications_pkey PRIMARY KEY (id);


--
-- Name: directus_operations directus_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_pkey PRIMARY KEY (id);


--
-- Name: directus_operations directus_operations_reject_unique; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_reject_unique UNIQUE (reject);


--
-- Name: directus_operations directus_operations_resolve_unique; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_resolve_unique UNIQUE (resolve);


--
-- Name: directus_panels directus_panels_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_panels
    ADD CONSTRAINT directus_panels_pkey PRIMARY KEY (id);


--
-- Name: directus_permissions directus_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_permissions
    ADD CONSTRAINT directus_permissions_pkey PRIMARY KEY (id);


--
-- Name: directus_policies directus_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_policies
    ADD CONSTRAINT directus_policies_pkey PRIMARY KEY (id);


--
-- Name: directus_presets directus_presets_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_presets
    ADD CONSTRAINT directus_presets_pkey PRIMARY KEY (id);


--
-- Name: directus_relations directus_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_relations
    ADD CONSTRAINT directus_relations_pkey PRIMARY KEY (id);


--
-- Name: directus_revisions directus_revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_revisions
    ADD CONSTRAINT directus_revisions_pkey PRIMARY KEY (id);


--
-- Name: directus_roles directus_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_roles
    ADD CONSTRAINT directus_roles_pkey PRIMARY KEY (id);


--
-- Name: directus_sessions directus_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_sessions
    ADD CONSTRAINT directus_sessions_pkey PRIMARY KEY (token);


--
-- Name: directus_settings directus_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_pkey PRIMARY KEY (id);


--
-- Name: directus_shares directus_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_shares
    ADD CONSTRAINT directus_shares_pkey PRIMARY KEY (id);


--
-- Name: directus_translations directus_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_translations
    ADD CONSTRAINT directus_translations_pkey PRIMARY KEY (id);


--
-- Name: directus_users directus_users_email_unique; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_users
    ADD CONSTRAINT directus_users_email_unique UNIQUE (email);


--
-- Name: directus_users directus_users_external_identifier_unique; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_users
    ADD CONSTRAINT directus_users_external_identifier_unique UNIQUE (external_identifier);


--
-- Name: directus_users directus_users_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_users
    ADD CONSTRAINT directus_users_pkey PRIMARY KEY (id);


--
-- Name: directus_users directus_users_token_unique; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_users
    ADD CONSTRAINT directus_users_token_unique UNIQUE (token);


--
-- Name: directus_versions directus_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_versions
    ADD CONSTRAINT directus_versions_pkey PRIMARY KEY (id);


--
-- Name: directus_webhooks directus_webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_webhooks
    ADD CONSTRAINT directus_webhooks_pkey PRIMARY KEY (id);


--
-- Name: exercises exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_telegram_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_telegram_id_key UNIQUE (telegram_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: workout_exercises workout_exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workout_exercises
    ADD CONSTRAINT workout_exercises_pkey PRIMARY KEY (id);


--
-- Name: workout_sets workout_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workout_sets
    ADD CONSTRAINT workout_sets_pkey PRIMARY KEY (id);


--
-- Name: workouts workouts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workouts
    ADD CONSTRAINT workouts_pkey PRIMARY KEY (id);


--
-- Name: workouts workouts_user_id_workout_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workouts
    ADD CONSTRAINT workouts_user_id_workout_date_key UNIQUE (user_id, workout_date);


--
-- Name: directus_access directus_access_policy_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_access
    ADD CONSTRAINT directus_access_policy_foreign FOREIGN KEY (policy) REFERENCES public.directus_policies(id) ON DELETE CASCADE;


--
-- Name: directus_access directus_access_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_access
    ADD CONSTRAINT directus_access_role_foreign FOREIGN KEY (role) REFERENCES public.directus_roles(id) ON DELETE CASCADE;


--
-- Name: directus_access directus_access_user_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_access
    ADD CONSTRAINT directus_access_user_foreign FOREIGN KEY ("user") REFERENCES public.directus_users(id) ON DELETE CASCADE;


--
-- Name: directus_collections directus_collections_group_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_collections
    ADD CONSTRAINT directus_collections_group_foreign FOREIGN KEY ("group") REFERENCES public.directus_collections(collection);


--
-- Name: directus_comments directus_comments_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_comments
    ADD CONSTRAINT directus_comments_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_comments directus_comments_user_updated_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_comments
    ADD CONSTRAINT directus_comments_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


--
-- Name: directus_dashboards directus_dashboards_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_dashboards
    ADD CONSTRAINT directus_dashboards_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_files directus_files_folder_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_files
    ADD CONSTRAINT directus_files_folder_foreign FOREIGN KEY (folder) REFERENCES public.directus_folders(id) ON DELETE SET NULL;


--
-- Name: directus_files directus_files_modified_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_files
    ADD CONSTRAINT directus_files_modified_by_foreign FOREIGN KEY (modified_by) REFERENCES public.directus_users(id);


--
-- Name: directus_files directus_files_uploaded_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_files
    ADD CONSTRAINT directus_files_uploaded_by_foreign FOREIGN KEY (uploaded_by) REFERENCES public.directus_users(id);


--
-- Name: directus_flows directus_flows_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_flows
    ADD CONSTRAINT directus_flows_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_folders directus_folders_parent_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_folders
    ADD CONSTRAINT directus_folders_parent_foreign FOREIGN KEY (parent) REFERENCES public.directus_folders(id);


--
-- Name: directus_notifications directus_notifications_recipient_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_notifications
    ADD CONSTRAINT directus_notifications_recipient_foreign FOREIGN KEY (recipient) REFERENCES public.directus_users(id) ON DELETE CASCADE;


--
-- Name: directus_notifications directus_notifications_sender_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_notifications
    ADD CONSTRAINT directus_notifications_sender_foreign FOREIGN KEY (sender) REFERENCES public.directus_users(id);


--
-- Name: directus_operations directus_operations_flow_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_flow_foreign FOREIGN KEY (flow) REFERENCES public.directus_flows(id) ON DELETE CASCADE;


--
-- Name: directus_operations directus_operations_reject_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_reject_foreign FOREIGN KEY (reject) REFERENCES public.directus_operations(id);


--
-- Name: directus_operations directus_operations_resolve_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_resolve_foreign FOREIGN KEY (resolve) REFERENCES public.directus_operations(id);


--
-- Name: directus_operations directus_operations_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_panels directus_panels_dashboard_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_panels
    ADD CONSTRAINT directus_panels_dashboard_foreign FOREIGN KEY (dashboard) REFERENCES public.directus_dashboards(id) ON DELETE CASCADE;


--
-- Name: directus_panels directus_panels_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_panels
    ADD CONSTRAINT directus_panels_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_permissions directus_permissions_policy_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_permissions
    ADD CONSTRAINT directus_permissions_policy_foreign FOREIGN KEY (policy) REFERENCES public.directus_policies(id) ON DELETE CASCADE;


--
-- Name: directus_presets directus_presets_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_presets
    ADD CONSTRAINT directus_presets_role_foreign FOREIGN KEY (role) REFERENCES public.directus_roles(id) ON DELETE CASCADE;


--
-- Name: directus_presets directus_presets_user_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_presets
    ADD CONSTRAINT directus_presets_user_foreign FOREIGN KEY ("user") REFERENCES public.directus_users(id) ON DELETE CASCADE;


--
-- Name: directus_revisions directus_revisions_activity_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_revisions
    ADD CONSTRAINT directus_revisions_activity_foreign FOREIGN KEY (activity) REFERENCES public.directus_activity(id) ON DELETE CASCADE;


--
-- Name: directus_revisions directus_revisions_parent_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_revisions
    ADD CONSTRAINT directus_revisions_parent_foreign FOREIGN KEY (parent) REFERENCES public.directus_revisions(id);


--
-- Name: directus_revisions directus_revisions_version_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_revisions
    ADD CONSTRAINT directus_revisions_version_foreign FOREIGN KEY (version) REFERENCES public.directus_versions(id) ON DELETE CASCADE;


--
-- Name: directus_roles directus_roles_parent_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_roles
    ADD CONSTRAINT directus_roles_parent_foreign FOREIGN KEY (parent) REFERENCES public.directus_roles(id);


--
-- Name: directus_sessions directus_sessions_share_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_sessions
    ADD CONSTRAINT directus_sessions_share_foreign FOREIGN KEY (share) REFERENCES public.directus_shares(id) ON DELETE CASCADE;


--
-- Name: directus_sessions directus_sessions_user_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_sessions
    ADD CONSTRAINT directus_sessions_user_foreign FOREIGN KEY ("user") REFERENCES public.directus_users(id) ON DELETE CASCADE;


--
-- Name: directus_settings directus_settings_project_logo_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_project_logo_foreign FOREIGN KEY (project_logo) REFERENCES public.directus_files(id);


--
-- Name: directus_settings directus_settings_public_background_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_public_background_foreign FOREIGN KEY (public_background) REFERENCES public.directus_files(id);


--
-- Name: directus_settings directus_settings_public_favicon_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_public_favicon_foreign FOREIGN KEY (public_favicon) REFERENCES public.directus_files(id);


--
-- Name: directus_settings directus_settings_public_foreground_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_public_foreground_foreign FOREIGN KEY (public_foreground) REFERENCES public.directus_files(id);


--
-- Name: directus_settings directus_settings_public_registration_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_public_registration_role_foreign FOREIGN KEY (public_registration_role) REFERENCES public.directus_roles(id) ON DELETE SET NULL;


--
-- Name: directus_settings directus_settings_storage_default_folder_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_storage_default_folder_foreign FOREIGN KEY (storage_default_folder) REFERENCES public.directus_folders(id) ON DELETE SET NULL;


--
-- Name: directus_shares directus_shares_collection_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_shares
    ADD CONSTRAINT directus_shares_collection_foreign FOREIGN KEY (collection) REFERENCES public.directus_collections(collection) ON DELETE CASCADE;


--
-- Name: directus_shares directus_shares_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_shares
    ADD CONSTRAINT directus_shares_role_foreign FOREIGN KEY (role) REFERENCES public.directus_roles(id) ON DELETE CASCADE;


--
-- Name: directus_shares directus_shares_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_shares
    ADD CONSTRAINT directus_shares_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_users directus_users_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_users
    ADD CONSTRAINT directus_users_role_foreign FOREIGN KEY (role) REFERENCES public.directus_roles(id) ON DELETE SET NULL;


--
-- Name: directus_versions directus_versions_collection_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_versions
    ADD CONSTRAINT directus_versions_collection_foreign FOREIGN KEY (collection) REFERENCES public.directus_collections(collection) ON DELETE CASCADE;


--
-- Name: directus_versions directus_versions_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_versions
    ADD CONSTRAINT directus_versions_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_versions directus_versions_user_updated_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_versions
    ADD CONSTRAINT directus_versions_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


--
-- Name: directus_webhooks directus_webhooks_migrated_flow_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_webhooks
    ADD CONSTRAINT directus_webhooks_migrated_flow_foreign FOREIGN KEY (migrated_flow) REFERENCES public.directus_flows(id) ON DELETE SET NULL;


--
-- Name: exercises exercises_category_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_category_foreign FOREIGN KEY (category) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: workout_exercises workout_exercises_workout_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workout_exercises
    ADD CONSTRAINT workout_exercises_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts(id) ON DELETE CASCADE;


--
-- Name: workout_sets workout_sets_workout_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workout_sets
    ADD CONSTRAINT workout_sets_workout_exercise_id_fkey FOREIGN KEY (workout_exercise_id) REFERENCES public.workout_exercises(id) ON DELETE CASCADE;


--
-- Name: workouts workouts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workouts
    ADD CONSTRAINT workouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict pJUYV6RFhgr3hYr4gArMdd8VnElfFM8WyrKO7r1BcY5JiY6hV7ReSA8cEm79SuI

