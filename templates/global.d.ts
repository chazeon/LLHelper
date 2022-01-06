declare namespace LLH {
    namespace Core {
        type AttributeType = 'smile'|'pure'|'cool';
        type AttributeAllType = AttributeType | 'all';
        /** 1 for smile, 2 for pure, 3 for cool */
        type AttributeIdType = 1|2|3;
        type GradeType = 1|2|3;
        /** 1 for muse, 2 for aqours, 3 for niji, 4 for liella */
        type SongGroupIdType = 1|2|3|4;
        /** 4 for muse, 5 for aqours, 60 for niji, 143 for liella */
        type BigGroupIdType = 4 | 5 | 60 | 143;

        /** member unit id */
        type UnitTypeIdType = number;
        /** group id */
        type MemberTagIdType = number;
        type AlbumIdType = number;
        /** the number id or jp name */
        type MemberIdType = UnitTypeIdType | string;
    }
    namespace API {
        interface SkillDetailDataType {
            score: number; // effect value
            time: number; // discharge time
            require: number; // trigger value
            possibility: number; // trigger rate
            limit?: number; // trigger limit
        }
        interface CardDataType {
            id: number;
            rarity: 'N'|'R'|'SR'|'SSR'|'UR';
            attribute: Core.AttributeAllType;
            typeid: Core.UnitTypeIdType;
            jpeponym: string;
            eponym: string;
            jpname: string;
            name: string;
            hp: number;
            smile: number;
            pure: number;
            cool: number;
            smile2: number;
            pure2: number;
            cool2: number;
            skill: number; // skill id
            Cskill: number; // leader skill id
            support: 0|1;
            special: 0|1;
            minslot: number;
            maxslot: number;
            album: Core.AlbumIdType;
            Cskillattribute: Core.AttributeType; // add from
            Cskillpercentage: number;
            Csecondskillattribute?: number; // effect value
            Csecondskilllimit?: number; // target
            jpskillname: string;
            skillname: string;
            skilleffect: number;
            triggertype: number;
            skillleveluppattern: number;
            skilldetail: SkillDetailDataType[];
            triggerrequire: number | string; // <require> | "<min>~<max>"
            triggertarget?: number[]; // chain target
            effecttarget?: number[]; // attribute up target
        }
        type CardDictDataType = {[id: string]: CardDataType};

        interface SongSettingDataType {
            liveid: string;
            difficulty: number;
            stardifficulty: number;
            combo: number;
            cscore: number;
            bscore: number;
            ascore: number;
            sscore: number;
            jsonpath: string;
            isac: 0|1;
            isswing: 0|1;
            positionweight: string[]; // float, length 9
            positionnote: string[]; // integer, length 9
            positionslider: string[]; // integer, length 9
            positionswing: string[]; // integer, length 9
            positionswingslider: string[]; // integer, length 9
            star: string; // integer
            slider: string; // integer
            swing: string; // integer
            swingslider: string; // integer
            time: string; // float
        }
        type SongSettingDictDataType = {[id: string]: SongSettingDataType};
        interface SongDataType {
            id: string;
            jpname: string;
            name: string;
            group: Core.SongGroupIdType;
            attribute: Core.AttributeAllType;
            settings: SongSettingDictDataType;
        }
        type SongDictDataType = {[id: string]: SongDataType};

        interface NoteDataType {
            timing_sec: number; // float
            notes_level: number;
            effect: number; // LLConst.NOTE_TYPE_*
            effect_value: number; // float, hold time
            position: number; // 1~9, 1 for right most, 9 for left most
        }

        interface SisDataType {
            id: string;
            type: 1 | 2; // type 1 for normal (circle), 2 for live arena (square)
            jpname: string;
            level?: number; // (LA only) level 1~5
            size: number;
            range?: 1 | 2; // (normal only) 1 for self, 2 for team
            effect_type: number;
            effect_value: number;
            fixed?: 1;
            color?: Core.AttributeIdType;
            member?: Core.UnitTypeIdType;
            grade?: Core.GradeType;
            group?: Core.MemberTagIdType;
            trigger_ref?: number;
            trigger_value?: number;
            sub_skill?: number; // sub sis id
            live_effect_type?: number;
            live_effect_interval?: number;

            /** only available after post processed */
            sub_skill_data?: SisDataType;
        }
        type SisDictDataType = {[id: string]: SisDataType};
        
        interface AlbumDataType {
            name: string;
            cnname?: string;
        }
        type AlbumDictDataType = {[id: string]: AlbumDataType};

        interface MemberTagDataType {
            name: string;
            cnname?: string;
            members: Core.UnitTypeIdType[];
        }
        type MemberTagDictDataType = {[id: string]: MemberTagDataType};

        interface UnitTypeDataType {
            name: string;
            cnname?: string;
            color?: Core.AttributeIdType;
            background_color?: string; // rrggbb
        }
        type UnitTypeDictDataType = {[id: string]: UnitTypeDataType};

        interface MetaDataType {
            album: AlbumDictDataType;
            member_tag: MemberTagDictDataType;
            unit_type: UnitTypeDictDataType;
            cskill_groups: Core.MemberTagIdType;
        }
    }

    namespace Internal {
        type NormalGemCategoryIdType = number;
        type NormalGemCategoryKeyType = string;
        interface NormalGemMetaType {
            /** en name */
            name: string;
            /** cn name */
            cnname: string;
            key: NormalGemCategoryKeyType;
            slot: number;
            /** 1 for self, 2 for team */
            effect_range: 1 | 2;
            effect_value: number;
            /** 1 means exist gem for 3 kinds of color */
            per_color?: 0 | 1;
            /** 1 means exist gem for 3 grades */
            per_grade?: 0 | 1;
            /** 1 means exist gem for different members */
            per_member?: 0 | 1;
            /** 1 means exist gem for different units */
            per_unit?: 0 | 1;
            /** 1 means effect_value is fixed value to add attribute */
            attr_add?: 0 | 1;
            /** 1 means effect_value is percentage buff to attribute */
            attr_mul?: 0 | 1;
            /** 1 means effect_value is percentage buff to score skill */
            skill_mul?: 0 | 1;
            /** 1 means effect_value is rate of heal to score on overheal */
            heal_mul?: 0 | 1;
            /** 1 means effect_value is percentage buff to attr when covered by ease */
            ease_attr_mul?: 0 | 1;
        }
        type NormalGemCategoryIdOrMetaType = NormalGemCategoryIdType | NormalGemMetaType;
    }

    namespace Depends {
        interface Promise<DoneT, FailT> {
            then<DoneU, FailU>(doneCallback: (arg: DoneT) => DoneU, failCallback: (arg: FailT) => FailU): Promise<DoneU, FailU>;
        }
        interface Deferred<DoneT, FailT> extends Promise<DoneT, FailT> {
            resolve(arg?: DoneT): void;
            reject(arg?: FailT): void;
        }

        interface Utils {
            createDeferred<DoneT, FailT>(): Deferred<DoneT, FailT>;
            whenAll(...args: Promise<any, any>[]): Promise<any, any>;
        }
    }

    /**
     * components:
     *   LLComponentBase
     *     +- LLValuedComponent
     *     | +- LLSelectComponent
     *     +- LLImageComponent
     *   LLComponentCollection
     *     +- LLFiltersComponent
     */
    namespace Component {
        interface LLComponentBase_Options {
            listen: {[e: string]: (event: Event) => void};
        }
        class LLComponentBase {
            constructor(id: string | HTMLElement, options: LLComponentBase_Options);

            id?: string;
            exist: boolean;
            visible: boolean;
            element?: HTMLElement;

            show(): void;
            hide(): void;
            toggleVisible(): void;
            serialize(): any;
            deserialize(data: any): void;
            on(eventName: string, callback: (event: Event) => void): void;
            isInDocument(): boolean;
        }
        interface LLValuedComponent_Options extends LLComponentBase_Options{
            valueKey: string;
        }
        class LLValuedComponent extends LLComponentBase {
            constructor(id: string | HTMLElement, options: LLValuedComponent_Options);

            value: string;
            valueKey: string;
            onValueChange?: (newValue: string) => void;

            get(): string;
            set(val: string): void;
        }
        interface LLSelectComponent_OptionDef {
            text: string;
            value: string;
            color?: string;
            background?: string;
        }
        /** returns true if keep the option, false to filter out the option */
        type LLSelectComponent_FilterCallback = (opt: LLSelectComponent_OptionDef) => boolean;
        class LLSelectComponent extends LLValuedComponent {
            constructor(id: string | HTMLElement, options: LLValuedComponent_Options);

            options: LLSelectComponent_OptionDef[];
            filter?: LLSelectComponent_FilterCallback;

            setOptions(options: LLSelectComponent_OptionDef[], filter?: LLSelectComponent_FilterCallback): void;
            filterOptions(filter?: LLSelectComponent_FilterCallback): void;
        }
        class LLComponentCollection {
            constructor();

            components: {[name: string]: LLComponentBase};

            add(name: string, component: LLComponentBase): void;
            getComponent(name: string): LLComponentBase;
            serialize(): any;
            deserialize(data: any): void;
            saveJson(): string;
            loadJson(json: string): void;
            saveLocalStorage(key: string): void;
            loadLocalStorage(key: string): void;
            deleteLocalStorage(key: string): void;
        }
        /** returns false to filter out the option */
        type LLFiltersComponent_FilterCallback = (targetOption: LLSelectComponent_OptionDef, filterValue: string, targetData?: any) => boolean;
        interface LLFiltersComponent_FilterDef {
            callbacks?: {[targetName: string]: LLFiltersComponent_FilterCallback};
            reverseCallbacks?: {[sourceName: string]: LLFiltersComponent_FilterCallback};
            dataGetter?: (opt: LLSelectComponent_OptionDef) => any;

            optionGroups?: LLSelectComponent_OptionDef[][];
            groupGetter?: () => number;
            currentOptionGroup?: number;
            affectOptionGroupFilters?: string[];
        }
        class LLFiltersComponent extends LLComponentCollection {
            constructor();

            filters: {[name: string]: LLFiltersComponent_FilterDef};
            freeze: boolean;
            onValueChange: (name: string, newValue: string) => void;

            setFreezed(isFreezed: boolean): void;
            isFreezed(): boolean;
            addFilterable(name: string, component: LLValuedComponent): void;
            addFilterCallback(sourceName: string, targetName: string, callback: LLFiltersComponent_FilterCallback): void;
            setFilterOptionGroupCallback(name: string, groupGetter: () => number, affectedBy: string[]): void;
            setFilterOptionGroups(name: string, groups: LLSelectComponent_OptionDef[][]): void;
            setFilterOptions(name: string, options: LLSelectComponent_OptionDef[]): void;
            getFilter(name: string, createIfAbsent?: boolean): LLFiltersComponent_FilterDef;
            /** handle changes when specified component's value change, when not provided name, handle all component's filters */
            handleFilters(name?: string): void;
        }
    }

    namespace Selector {
        class LLCardSelector extends Component.LLFiltersComponent {

        }
        interface LLGemSelectorComponent_Options {
            gemData?: API.SisDictDataType;
            includeNormalGemCategory: boolean;
            includeNormalGem: boolean;
            includeLAGem: boolean;
        }
        class LLGemSelectorComponent extends Component.LLFiltersComponent {
            constructor(id: string | HTMLElement, options: LLGemSelectorComponent_Options);

            gemData?: API.SisDictDataType;
            includeNormalGemCategory: boolean;
            includeNormalGem: boolean;
            includeLAGem: boolean;

            setGemData(gemData: API.SisDictDataType): void;
            getGemId(): string;
        }
    }

    namespace ConstUtil {
        interface Member {
            getMemberName(memberId: Core.MemberIdType, iscn?: boolean): string;
            getBigGroupId(memberId: Core.MemberIdType): Core.BigGroupIdType;
            isNonetTeam(members: TODO.LLMember[]): Core.BigGroupIdType;
        }
        interface Group {
            getBigGroupIds(): Core.BigGroupIdType[];
            getGroupName(groupId: Core.MemberTagIdType): string;
        }
        interface Gem {
            getMemberGemList(): Core.UnitTypeIdType[];
            getUnitGemList(): Core.MemberTagIdType[];
            isMemberGemExist(memberId: Core.MemberIdType): boolean;
            getNormalGemMeta(typeOrMeta: Internal.NormalGemCategoryIdOrMetaType): Internal.NormalGemMetaType;
            getNormalGemTypeKeys(): Internal.NormalGemCategoryKeyType[];
            getNormalGemName(typeOrMeta: Internal.NormalGemCategoryIdOrMetaType): string;
            getNormalGemBriefDescription(typeOrMeta: Internal.NormalGemCategoryIdOrMetaType): string;
            getNormalGemNameAndDescription(typeOrMeta: Internal.NormalGemCategoryIdOrMetaType): string;
            /** true if gem color should follow member attribute, false if follow map attribute */
            isGemFollowMemberAttribute(typeOrMeta: Internal.NormalGemCategoryIdOrMetaType): boolean;

            getGemDescription(gemData: API.SisDataType, iscn?: boolean): string;
            getGemFullDescription(gemData: API.SisDataType): string;
            getGemColor(gemData: API.SisDataType): string;

            postProcessGemData(gemData: API.SisDictDataType): void;
        }
    }

    class LLData<DataT> {
        constructor(brief_url: string, detail_url: string, brief_keys: string[], version?: string);

        getAllBriefData(keys?: string[], url?: string): Depends.Promise<{[id: string]: DataT}, void>;
        getDetailedData(index: string, url?: string): Depends.Promise<DataT, void>;
    }

    class LLSimpleKeyData<T> {
        constructor(url: string, keys: string[]);

        get(keys?: string[], url?: string): Depends.Promise<T, void>;
    }
    
    interface LLConst {
        initMetadata(metaData: API.MetaDataType): void;

        Member: ConstUtil.Member;
        Group: ConstUtil.Group;
        Gem: ConstUtil.Gem;
        // TODO
    }

    namespace TODO {
        type LLMember = any;
    }
}

declare var LLCardData: LLH.LLData<LLH.API.CardDataType>;
declare var LLSongData: LLH.LLData<LLH.API.SongDataType>;
declare var LLSisData: LLH.LLData<LLH.API.SisDataType>;
declare var LLMetaData: LLH.LLSimpleKeyData<LLH.API.MetaDataType>;

declare var LLDepends: LLH.Depends.Utils;
