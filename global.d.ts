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
        /** 1 for N, 2 for R, 3 for SR, 4 for UR, 5 for SSR */
        type RarityNumberType = 1 | 2 | 3 | 4 | 5;
        type RarityStringType = 'N' | 'R' | 'SR' | 'SSR' | 'UR';

        /** member unit id */
        type UnitTypeIdType = number;
        /** group id */
        type MemberTagIdType = number;
        type AlbumIdType = number;
        /** the number id or jp name */
        type MemberIdType = UnitTypeIdType | string;
        /** the number id for card */
        type CardIdType = number;
        /** the string id for card */
        type CardIdStringType = string;
        /** the number id or string of number id */
        type CardIdOrStringType = CardIdType | CardIdStringType;
        /** string of integer */
        type SongIdType = string;
        /** string of integer */
        type SongSettingIdType = string;
        /** float, length 9 */
        type PositionWeightType = string[] | number[];
        /** the string id for accessory */
        type AccessoryIdStringType = string;
        /** the trigger/effect target */
        type TriggerTargetType = MemberTagIdType[];
        type TriggerTargetMemberType = UnitTypeIdType[];

        type MezameType = 0 | 1;
        /** 0: cn, 1: jp */
        type LanguageType = 0 | 1;
    }
    namespace API {
        interface SkillDetailDataType {
            score: number; // effect value
            time: number; // discharge time
            require: number; // trigger value
            possibility: number; // trigger rate, 0~100
            limit?: number; // trigger limit
        }
        interface CardDataType {
            id: Core.CardIdType;
            rarity: Core.RarityStringType;
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
            triggertarget?: Core.TriggerTargetType; // chain target
            effecttarget?: Core.TriggerTargetType; // attribute up target
        }
        type CardDictDataType = {[id: Core.CardIdStringType]: CardDataType};

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
            positionweight: Core.PositionWeightType
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
            cnname?: string;
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
            level_up_skill?: number; // next sis id

            /** only available after post processed */
            sub_skill_data?: SisDataType;
            /** only available after post processed */
            level_up_skill_data?: SisDataType;
            /** only available after post processed */
            level_down_skill_data?: SisDataType;
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

        interface AccessoryLevelDataType {
            level: number;
            effect_value: number;
            time: number;
            rate: number;
            smile?: number;
            pure?: number;
            cool?: number;
        }

        interface AccessoryDataType {
            id: Core.AccessoryIdStringType;
            jpname: string;
            cnname?: string;
            rarity: Core.RarityNumberType;
            smile: number;
            pure: number;
            cool: number;
            is_material: 0 | 1;
            effect_type: number;
            default_max_level: number; // usually 4
            max_level: number; // usually 8
            icon_asset: string;
            effect_target?: Core.TriggerTargetMemberType;
            levels?: AccessoryLevelDataType[];
            unit_id?: Core.CardIdStringType;
        }
        type AccessoryDictDataType = {[id: Core.AccessoryIdStringType]: AccessoryDataType};

    }

    namespace Internal {
        interface CSkillDataType {
            /** add to attribute */
            attribute: Core.AttributeType;
            /** add from attribute */
            Cskillattribute: Core.AttributeType;
            /** percentage */
            Cskillpercentage: number;
            /** effect value, percentage */
            Csecondskillattribute?: number;
            /** target group */
            Csecondskilllimit?: Core.MemberTagIdType;
        }

        type AlbumGroupIdType = number;
        interface ProcessedAlbumDataType extends API.AlbumDataType {
            albumGroupId: AlbumGroupIdType;
        }
        type ProcessedAlbumDictDataType = {[id: string]: ProcessedAlbumDataType};

        interface ProcessedAlbumGroupType extends API.AlbumDataType {
            albums: Core.AlbumIdType[];
            id: AlbumGroupIdType;
        }

        interface ProcessedSongSettingDataType extends API.SongSettingDataType {
            song: Core.SongIdType;
        }
        type ProcessedSongSettingDictDataType = {[id: string]: ProcessedSongSettingDataType};

        interface ProcessedAccessoryDataType extends API.AccessoryDataType {
            card?: API.CardDataType;
            main_attribute?: Core.AttributeType;
            type: string;
            unit_type_id?: Core.UnitTypeIdType;
        }
        type ProcessedAccessoryDictDataType = {[id: Core.AccessoryIdStringType]: ProcessedAccessoryDataType};


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

        interface SubMemberSaveDataType {
            cardid: Core.CardIdOrStringType; // int
            mezame: 0 | 1;
            skilllevel: number; // 1~8
            maxcost: number; // 0~8
        }

        interface AttributesValue {
            smile: number;
            pure: number;
            cool: number;
        }

        interface AccessorySaveDataType {
            id: Core.AccessoryIdStringType;
            level: number;
        }

        interface MemberSaveDataType extends SubMemberSaveDataType, AttributesValue {
            hp: number; // int
            gemlist: NormalGemCategoryKeyType[];
            accessory?: AccessorySaveDataType;
        }

        interface UnitSaveDataTypeV104 {
            version: 104;
            team: MemberSaveDataType[];
            gemstock: TODO.GemStockType;
            submember: SubMemberSaveDataType[];
        }
        type UnitSaveDataType = UnitSaveDataTypeV104;

        interface CalculateResultType {
            attrStrength: number[];
            finalAttr: AttributesValue;
            bonusAttr: AttributesValue;
            totalStrength: number;
            totalAttrStrength: number;
            totalSkillStrength: number;
            totalHP: number;
            averageSkillsActiveCount: number[];
            averageSkillsActiveChanceCount: number[];
            averageSkillsActiveNoEffectCount: number[];
            averageSkillsActiveHalfEffectCount: number[];
            averageAccessoryActiveCount: number[];
            averageAccessoryActiveChanceCount: number[];
            averageAccessoryActiveNoEffectCount: number[];
            averageAccessoryActiveHalfEffectCount: number[];
            naivePercentile: number[];
        }

        interface NoteTriggerDataType {
            /** 1: enter, 2: hit, 3: hold, 4: release */
            type: 1 | 2 | 3 | 4;
            /** float */
            time: number;
            note: API.NoteDataType;
            /** 0.5 for swing, 1 for other */
            factor: number;
        }
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
            whenAllByArray(arr: Promise<any, any>[]): Promise<any, any>;
        }
    }

    namespace Mixin {
        interface SaveLoadJson {
            saveJson(): string;
            loadJson(jsonData: string): void;
        }

        interface LanguageSupport {
            setLanguage(language: Core.LanguageType): void;
        }
    }

    /**
     * components:
     *   LLComponentBase
     *     +- LLValuedComponent
     *     | +- LLSelectComponent
     *     | +- LLValuedMemoryComponent
     *     +- LLImageComponent
     *   LLComponentCollection
     *     +- LLFiltersComponent
     */
    namespace Component {
        type HTMLElementOrId = string | HTMLElement;
        interface LLComponentBase_Options {
            listen: {[e: string]: (event: Event) => void};
        }
        class LLComponentBase {
            constructor(id: HTMLElementOrId, options: LLComponentBase_Options);

            id?: string;
            exist: boolean;
            visible: boolean;
            element?: HTMLElement;

            show(): void;
            hide(): void;
            toggleVisible(): void;
            setVisible(visible: boolean): void;
            serialize(): any;
            deserialize(data: any): void;
            on(eventName: string, callback: (event: Event) => void): void;
            isInDocument(): boolean;
        }
        interface LLValuedComponent_Options extends LLComponentBase_Options {
            valueKey: string;
        }
        class LLValuedComponent extends LLComponentBase {
            constructor(id: HTMLElementOrId, options: LLValuedComponent_Options);

            value: string;
            valueKey: string;
            onValueChange?: (newValue: string) => void;

            get(): string;
            set(val: string): void;
        }
        class LLValuedMemoryComponent extends LLValuedComponent {
            constructor(initialValue: any);
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
            constructor(id: HTMLElementOrId, options: LLValuedComponent_Options);

            options: LLSelectComponent_OptionDef[];
            filter?: LLSelectComponent_FilterCallback;

            setOptions(options: LLSelectComponent_OptionDef[], filter?: LLSelectComponent_FilterCallback): void;
            filterOptions(filter?: LLSelectComponent_FilterCallback): void;
        }
        interface LLImageComponent_Options extends LLComponentBase_Options {
            srcList?: string[];
        }
        class LLImageComponent extends LLComponentBase {
            constructor(id: HTMLElementOrId, options: LLImageComponent_Options);
            
            srcList: string[];
            curSrcIndex?: number;

            setSrcList(newSrcList: string[]): void;
            setAltText(text: string): void;
        }
        interface LLAccessoryComponent_Options extends LLComponentBase_Options {
            size?: number // in pixel, default 128
        }
        class LLAccessoryComponent extends LLComponentBase {
            constructor(id: HTMLElementOrId, options: LLAccessoryComponent_Options);

            accessoryId?: Core.AccessoryIdStringType;
            size: number;
            accessoryImage: LLImageComponent;

            setAccessory(newAccessory?: Core.AccessoryIdStringType | API.AccessoryDataType, language?: Core.LanguageType): void;
        }
        class LLComponentCollection implements Mixin.SaveLoadJson {
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
        type LLFiltersComponent_OptionGroupType = {[id: string]: LLSelectComponent_OptionDef[]};
        interface LLFiltersComponent_FilterDef {
            callbacks?: {[targetName: string]: LLFiltersComponent_FilterCallback};
            reverseCallbacks?: {[sourceName: string]: LLFiltersComponent_FilterCallback};
            dataGetter?: (opt: LLSelectComponent_OptionDef) => any;

            optionGroups?: LLFiltersComponent_OptionGroupType;
            groupGetter?: () => string;
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
            addFilterable(name: string, component: LLValuedComponent, dataGetter?: (opt: LLSelectComponent_OptionDef) => any): void;
            addFilterCallback(sourceName: string, targetName: string, callback: LLFiltersComponent_FilterCallback): void;
            setFilterOptionGroupCallback(name: string, groupGetter: () => string, affectedBy: string[]): void;
            setFilterOptionGroups(name: string, groups: LLFiltersComponent_OptionGroupType): void;
            setFilterOptions(name: string, options: LLSelectComponent_OptionDef[]): void;
            getFilter(name: string, createIfAbsent?: boolean): LLFiltersComponent_FilterDef;
            /** handle changes when specified component's value change, when not provided name, handle all component's filters */
            handleFilters(name?: string): void;
            override deserialize(data: any): void;
        }
    }

    namespace Selector {
        interface LLCardSelectorComponent_Options {
            cards: API.CardDictDataType;
            noShowN?: boolean;
        }
        class LLCardSelectorComponent extends Component.LLFiltersComponent implements Mixin.LanguageSupport {
            constructor(id: Component.HTMLElementOrId, options: LLCardSelectorComponent_Options);

            /** album group id to members type id mapping */
            private albumGroupMemberCache: {[albumGroupId: string]: Core.UnitTypeIdType[]};
            cards: API.CardDictDataType;

            setCardData(cards: API.CardDictDataType, resetCardSelection?: boolean): void;
            getCardId(): Core.CardIdOrStringType;
            scrollIntoView(): void;

            // optional callback
            onCardChange?: (cardId: Core.CardIdOrStringType) => void;

            // implements LanguageSupport
            setLanguage(language: Core.LanguageType): void;
        }
        interface LLSongSelectorComponent_Options {
            songs: API.SongDictDataType;
            excludeDefaultSong?: boolean;
            includeMapInfo?: boolean;
            friendCSkill?: TODO.LLCSkillComponent;
        }
        class LLSongSelectorComponent extends Component.LLFiltersComponent implements Mixin.LanguageSupport {
            constructor(id: Component.HTMLElementOrId, options: LLSongSelectorComponent_Options)

            songs: API.SongDictDataType;
            songSettings: Internal.ProcessedSongSettingDictDataType;
            includeMapInfo: boolean;
            friendCSkill?: TODO.LLCSkillComponent;

            setSongData(songs: API.SongDictDataType, includeDefaultSong?: boolean): void;

            getSelectedSongId(): Core.SongIdType;
            getSelectedSong(): API.SongDataType;
            getSelectedSongSettingId(): Core.SongSettingIdType;
            getSelectedSongSetting(): Internal.ProcessedSongSettingDataType;
            getSongAttribute(): Core.AttributeAllType;
            getMap(customWeight: Core.PositionWeightType): Model.LLMap;

            private updateMapInfo(songSetting: Internal.ProcessedSongSettingDataType): void;

            // optional callback
            onSongSettingChange?: (songSettingId: Core.SongSettingIdType, songSetting: Internal.ProcessedSongSettingDataType) => void;
            onSongColorChange?: (attribute: Core.AttributeType) => void;

            // implements LanguageSupport
            setLanguage(language: Core.LanguageType): void;
        }
        interface LLGemSelectorComponent_Options {
            gemData?: API.SisDictDataType;
            includeNormalGemCategory: boolean;
            includeNormalGem: boolean;
            includeLAGem: boolean;
        }
        interface LLGemSelectorComponent_DetailController {
            set(data: string | API.SisDataType, language: Core.LanguageType): void;
        }
        class LLGemSelectorComponent extends Component.LLFiltersComponent implements Mixin.LanguageSupport {
            constructor(id: Component.HTMLElementOrId, options: LLGemSelectorComponent_Options);

            gemData?: API.SisDictDataType;
            includeNormalGemCategory: boolean;
            includeNormalGem: boolean;
            includeLAGem: boolean;

            setGemData(gemData: API.SisDictDataType): void;
            getGemId(): string;

            // implements LanguageSupport
            setLanguage(language: Core.LanguageType): void;
        }

        interface LLAccessorySelectorComponent_Options {
            accessoryData?: API.AccessoryDictDataType;
            cardData?: API.CardDictDataType;
            showDetail?: boolean;
            showLevelSelect?: boolean;
            excludeMaterial?: boolean;
        }
        interface LLAccessorySelectorComponent_DetailController {
            set(data: Internal.ProcessedAccessoryDataType, language: Core.LanguageType): void;
        }
        interface LLAccessorySelectorComponent_BriefController {
            set(data: Internal.ProcessedAccessoryDataType, level: number, language: Core.LanguageType): void;
        }

        class LLAccessorySelectorComponent extends Component.LLFiltersComponent implements Mixin.LanguageSupport {
            constructor(id: Component.HTMLElementOrId, options: LLAccessorySelectorComponent_Options);

            accessoryData?: Internal.ProcessedAccessoryDictDataType;
            cardData?: API.CardDictDataType;
            showDetail: boolean;
            showLevelSelect: boolean;
            excludeMaterial: boolean;

            setAccessoryData(accessoryData: API.AccessoryDictDataType, cardData: API.CardDictDataType): void;
            getAccessoryId(): Core.AccessoryIdStringType;
            getAccessoryLevel(): number; // level range 1~8
            getAccessorySaveData(): Internal.AccessorySaveDataType;

            // implements LanguageSupport
            setLanguage(language: Core.LanguageType): void;
        }
    }

    namespace ConstUtil {
        interface Member {
            /** group can be the id in number or string form */
            isMemberInGroup(memberId: Core.MemberIdType, groupId: Core.MemberTagIdType | string): boolean
            getMemberName(memberId: Core.MemberIdType, language?: Core.LanguageType): string;
            getBigGroupId(memberId: Core.MemberIdType): Core.BigGroupIdType;
            isNonetTeam(members: Model.LLMember[]): Core.BigGroupIdType;
            getMemberGrade(memberId: Core.MemberIdType): Core.GradeType;
            getMemberTypeIdsInGroups(groups: Core.MemberTagIdType[] | Core.MemberTagIdType): Core.UnitTypeIdType[];
            getMemberNamesInGroups(groups: Core.MemberTagIdType[] | Core.MemberTagIdType): string[];
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
            getGemFullDescription(gemData: API.SisDataType, iscn?: boolean): string;
            getGemColor(gemData: API.SisDataType): string;

            postProcessGemData(gemData: API.SisDictDataType): void;
        }
        interface Album {
            getAlbumGroupByAlbumId(albumId: Core.AlbumIdType): Internal.ProcessedAlbumGroupType;
            getAlbumGroups(): Internal.ProcessedAlbumGroupType[];
            isAlbumInAlbumGroup(albumId: Core.AlbumIdType, albumGroupId: Internal.AlbumGroupIdType): boolean;
        }
        interface Accessory {
            postProcessAccessoryData(accessoryData: API.AccessoryDictDataType, cardData: API.CardDictDataType): Internal.ProcessedAccessoryDictDataType;
            postProcessSingleAccessoryData(accessoryData: API.AccessoryDataType, cardData: API.CardDictDataType): Internal.ProcessedAccessoryDataType;
            
            getAccessoryDescription(accessoryData: Internal.ProcessedAccessoryDataType, language?: Core.LanguageType): string;
            getAccessoryMainAttribute(accessory: API.AccessoryDataType): Core.AttributeType;
            getAccessoryType(accessory: API.AccessoryDataType): string;
            getAccessoryLevelAttribute(accessory: API.AccessoryDataType, level: number): Internal.AttributesValue;

            canEquipAccessory(accessory: API.AccessoryDataType, level: number, cardId: Core.CardIdOrStringType): boolean;
        }
        interface Common {
            getRarityString(rarity: Core.RarityNumberType): Core.RarityStringType;
            getAttributeColor(attribute: Core.AttributeType): string;
        }
        interface Attributes {
            makeAttributes(smile: number, pure: number, cool: number): Internal.AttributesValue;
            makeAttributes0(): Internal.AttributesValue;
            copyAttributes(fromAttribute: Internal.AttributesValue): Internal.AttributesValue;
            multiplyCeilingAttributes(lhs: Internal.AttributesValue, factor: number): Internal.AttributesValue;
            addAttributes(lhs: Internal.AttributesValue, rhs: Internal.AttributesValue): Internal.AttributesValue;
            /** return baseAttribute */
            addToAttributes(baseAttribute: Internal.AttributesValue, deltaAttribute: Internal.AttributesValue): Internal.AttributesValue;
        }
        interface Skill {
            getTriggerTargetDescription(targets: Core.TriggerTargetType): string;
            getTriggerTargetMemberDescription(targets: Core.TriggerTargetMemberType): string;
            getTriggerLimitDescription(triggerLimit: number): string;
            getTriggerDescription(triggerType: number, triggerValue: number, triggerTarget?: Core.TriggerTargetType): string;
            getEffectDescription(effectType: number, effectValue: number, dischargeTime: number, effectTarget?: Core.TriggerTargetType, effectTargetMember?: Core.TriggerTargetMemberType): string;

            getEffectBrief(effectType: number): string;

            /** level base 0 */
            getCardSkillDescription(card: API.CardDataType, level: number): string;
            /** level base 0 */
            getAccessorySkillDescription(accessory: API.AccessoryDataType, level: number): string;

            isStrengthSupported(card: API.CardDataType): boolean;
        }
    }

    namespace Model {
        interface LLSisGem_Options {
            grade?: Core.GradeType;
            member?: Core.UnitTypeIdType;
            color?: Core.AttributeType;
            unit?: Core.BigGroupIdType;
        }
        class LLSisGem {
            constructor(type: Internal.NormalGemCategoryIdType, options: LLSisGem_Options);

            isEffectRangeSelf(): boolean;
            isEffectRangeAll(): boolean;
            isSkillGem(): boolean;
            isAccuracyGem(): boolean;
            isValid(): boolean;
            isAttrMultiple(): boolean;
            isAttrAdd(): boolean;
            isHealToScore(): boolean;
            isScoreMultiple(): boolean;
            isNonet(): boolean;
            isMemberGem(): boolean;
            getEffectValue(): number;
            getNormalGemType(): Internal.NormalGemCategoryIdType;
            getGemStockKeys(): string[];
            getGemStockCount(gemStock: TODO.GemStockType): number;
            getAttributeType(): Core.AttributeType;
            setAttributeType(newAttribute: Core.AttributeType): void;

            static getGemSlot(type: Internal.NormalGemCategoryIdType): number;
            static getGemStockCount(gemStock: TODO.GemStockType, gemStockKeys: string[]): number;

            private type: Internal.NormalGemCategoryIdType;
            private color?: Core.AttributeType;
            private grade?: Core.GradeType;
            private member?: Core.MemberIdType;
            private unit?: Core.BigGroupIdType;
            private meta: Internal.NormalGemMetaType;
            private gemStockKeys: string[];
        }

        interface LLMap_Options {
            song?: LLH.API.SongDataType;
            songSetting?: LLH.API.SongSettingDataType;
            friendCSkill?: Internal.CSkillDataType;
        }
        interface LLMap_SaveData {
            attribute: Core.AttributeType;
            weights: number[];
            /** sum(weights) */
            totalWeight: number;
            friendCSkill: Internal.CSkillDataType;
            combo: number;
            star: number;
            /** float */
            time: number;
            perfect: number;
            starPerfect: number;
            /** percentage */
            tapup: number;
            /** percentage */
            skillup: number;
            songUnit: Core.SongGroupIdType;
            /** int 1~10 */
            speed: number;
            combo_fever_pattern: 1 | 2;
            over_heal_pattern: 0 | 1;
            perfect_accuracy_pattern: 0 | 1;
            trigger_limit_pattern: 0 | 1;            
        }
        class LLMap implements Mixin.SaveLoadJson {
            constructor(options?: LLMap_Options);
            setSong(song: API.SongDataType, songSetting: API.SongSettingDataType): void;
            setWeights(weights: Core.PositionWeightType): void;
            setFriendCSkill(addToAttribute: Core.AttributeType, addFromAttribute: Core.AttributeType, percentage: number, groupLimit: number, groupPercentage: number): void;
            setSongDifficultyData(combo: number, star: number, time: number, perfect: number, starPerfect: number): void;
            setMapBuff(tapup: number, skillup: number): void;
            setDistParam(distParam: Layout.ScoreDistParam.ScoreDistParamSaveData): void;

            data: LLMap_SaveData;
            saveData(): LLMap_SaveData;
            loadData(data: LLMap_SaveData): void;

            // implements
            saveJson(): string;
            loadJson(jsonData: string): void;
        }

        interface LLMember_Options extends Internal.MemberSaveDataType {
            card: API.CardDataType;
            accessoryData: API.AccessoryDataType;
        }
        class LLMember {
            constructor(options: LLMember_Options, mapAttribute: Core.AttributeType);

            cardid: Core.CardIdType;
            smile: number;
            pure: number;
            cool: number;
            skilllevel: number;
            maxcost: number;
            hp: number;
            card: API.CardDataType;
            gems: LLSisGem[];
            accessory?: API.AccessoryDataType;
            accessoryLevel: number;
            raw: LLMember_Options;

            accessoryAttr: Internal.AttributesValue;

            /** set after calcDisplayAttr() */
            displayAttr: Internal.AttributesValue;
            /** set after calcAttrWithGem() */
            cumulativeTeamGemBonus: number[];
            attrWithGem: number;
            /** set after calcAttrWithCSkill() */
            bonusAttr: Internal.AttributesValue;
            finalAttr: Internal.AttributesValue;
            attrStrength: number;
            attrStrengthWithAccuracy: number;
            cumulativeCSkillBonus: number[];
            cumulativeAttrStrength: number[];
            /** set after calcAttrDebuff() */
            attrDebuff: number;
            /** set after getGrade() */
            grade: Core.GradeType;

            hasSkillGem(): boolean;
            getAccuracyGemFactor(): number;
            empty(): boolean;
            calcDisplayAttr(): Internal.AttributesValue;
            calcAttrWithGem(mapcolor: Core.AttributeType, teamgem: LLSisGem[][]): number;
            calcAttrWithCSkill(mapcolor: Core.AttributeType, cskills: Internal.CSkillDataType[]): number;
            getAttrBuffFactor(mapcolor: Core.AttributeType, mapunit: Core.SongGroupIdType): number;
            getAttrDebuffFactor(mapcolor: Core.AttributeType, mapunit: Core.SongGroupIdType, weight: number, totalweight: number): number;
            calcAttrDebuff(mapdata: LLMap_SaveData, pos: number, teamattr: number): number;
            getMicPoint(): number;
            calcTotalCSkillPercentageForSameColor(mapcolor: Core.AttributeType, cskills: Internal.CSkillDataType[]): number;
            getGrade(): Core.GradeType;
            getSkillDetail(levelBoost?: number): API.SkillDetailDataType;
            getAccessoryDetail(levelBoost?: number): API.AccessoryLevelDataType;
        }

        class LLTeam {
            constructor(members: LLMember[]);

            members: LLMember[];

            /** set after calculateAttributeStrength() */
            attrStrength: number[];
            attrDebuff: number[];
            finalAttr: Internal.AttributesValue;
            bonusAttr: Internal.AttributesValue;
            totalAttrNoAccuracy: number;
            totalAttrWithAccuracy: number;
            totalWeight: number[];
            totalAttrStrength: number;
            totalHP: number;
            /** set after calculateSkillStength() */
            avgSkills: TODO.LLSkill[];
            maxSkills: TODO.LLSkill[];
            minScore: number;
            averageScoreNumber: number;
            averageScore: number | string;
            maxScoreNumber: number;
            maxScore: number | string;
            averageHeal: number;
            maxHeal: number;
            totalSkillStrength: number;
            totalStrength: number;
            /** set after calculateScoreDistribution() or simulateScoreDistribution() */
            scoreDistribution: number[];
            scoreDistributionMinScore: number;
            probabilityForMinScore: number;
            probabilityForMaxScore: number;
            /** set after simulateScoreDistribution() */
            memberBonusFactor: number[];
            averageSkillsActiveCount: number[];
            averageSkillsActiveChanceCount: number[];
            averageSkillsActiveNoEffectCount: number[];
            averageSkillsActiveHalfEffectCount: number[];
            averageAccessoryActiveCount: number[];
            averageAccessoryActiveChanceCount: number[];
            averageAccessoryActiveNoEffectCount: number[];
            averageAccessoryActiveHalfEffectCount: number[];
            averageAccuracyNCoverage: number;
            /** set after calculatePercentileNaive() */
            naivePercentile: number[];
            naiveExpection: number;
            /** set after calculateMic() */
            equivalentURLevel: number;

            calculateAttributeStrength(mapdata: LLMap_SaveData): void;
            calculateSkillStrength(mapdata: LLMap_SaveData): void;
            calculateScoreDistribution(): void;
            simulateScoreDistribution(mapdata: LLMap_SaveData, noteData: API.NoteDataType[], simCount: number): void;
            calculatePercentileNaive(): void;
            calculateMic(): void;
            autoArmGem(mapdata: LLMap_SaveData, gemStock: TODO.GemStockType): void;
            autoUnit(mapdata: LLMap_SaveData, gemStock: TODO.GemStockType, submembers: LLMember[]): void;
            getResults(): Internal.CalculateResultType;
        }

        class LLSimulateContext_ActiveSkill {
            /** end time */
            t: number;
            /** member id */
            m: number;
            /** repeated member id, repeat target member */
            rm: number;
            /** effect static data */
            e: LLSimulateContext_EffectStaticInfo;
            /**
             * effect value
             * for SYNC & ATTRIBUTE_UP effect: increased attribute after sync/attribute up
             */
            v: number;
            /** sync target */
            st: number;
        }
        class LLSimulateContext_LastActiveSkill {
            /** member id */
            m: number;
            /** level boost */
            b: number;
            /** activate frame */
            af: number;
            /** repeat frame */
            rf: number;
            /** is accessory skill */
            a: boolean;
        }

        class LLSimulateContext_EffectStaticInfo {
            effectType: number;
            /** members index list, including self */
            syncTargets?: number[];
            /** members index list */
            attributeUpTargets?: number[];
            /** [activate member] = member index list excluding activate member */
            syncTargetsBy?: number[][];
        }
        class LLSimulateContext_SkillStaticInfo {
            /** trigger condition will never be hit */
            neverTrigger: boolean;
            /** require, member bitset for SKILL_TRIGGER_MEMBERS */
            triggerRequire: number;
            /** percentage 0~100 */
            triggerPossibility: number;
            /** percentage 0~100 */
            accessoryPosibility: number;
            triggerLimit?: number;
            chainTypeIdBits?: {[typeId: Core.UnitTypeIdType]: number};
            skillEffect?: LLSimulateContext_EffectStaticInfo;
            accessoryEffect?: LLSimulateContext_EffectStaticInfo;
        }
        class LLSimulateContext_Trigger {
            /** member id */
            m: number;
            /** start value, member bitset for SKILL_TRIGGER_MEMBERS */
            s: number;
            /** is active */
            a: boolean;
            st: LLSimulateContext_SkillStaticInfo;
            /** active effect info */
            ae: LLSimulateContext_EffectStaticInfo;
        }
        class LLSimulateContext_SkillDynamicInfo {
            staticInfo: LLSimulateContext_SkillStaticInfo;
            trigger?: LLSimulateContext_Trigger;
            attributeUp?: number;
            attributeSync?: number;
        }
        class LLSimulateContextStatic {
            constructor(mapdata: LLMap_SaveData, members: LLMember[], maxTime: number);
            
            members: LLMember[];
            totalNote: number;
            totalTime: number;
            totalPerfect: number;
            mapSkillPossibilityUp: number;
            mapTapScoreUp: number;
            comboFeverPattern: number;
            perfectAccuracyPattern: number;
            overHealPattern: number;
            triggerLimitPattern: number;
            /** percentage 0~100 */
            skillPosibilityDownFixed: number;
            hasRepeatSkill: boolean;

            skillsStatic: LLSimulateContext_SkillStaticInfo[];

            makeSkillStaticInfo(index: number): LLSimulateContext_SkillStaticInfo;
            /** assume the skill/accessory do exist */
            makeEffectStaticInfo(index: number, isAccessory: boolean): LLSimulateContext_EffectStaticInfo;
        }

        class LLSimulateContext {
            constructor(staticData: LLSimulateContextStatic);

            staticData: LLSimulateContextStatic;
            skillsDynamic: LLSimulateContext_SkillDynamicInfo[];

            members: LLMember[];
            currentTime: number;
            currentFrame: number;
            currentNote: number;
            currentCombo: number;
            currentScore: number;
            currentPerfect: number;
            currentStarPerfect: number;
            currentHeal: number;
            skillsActiveCount: number[];
            skillsActiveChanceCount: number[];
            skillsActiveNoEffectCount: number[];
            skillsActiveHalfEffectCount: number[];
            accessoryActiveCount: number[];
            accessoryActiveChanceCount: number[];
            accessoryActiveNoEffectCount: number[];
            accessoryActiveHalfEffectCount: number[];
            currentAccuracyCoverNote: number;
            totalPerfectScoreUp: number;
            remainingPerfect: number;
            triggers: {[type: number]: LLSimulateContext_Trigger[]};
            memberSkillOrder: number[];
            lastFrameForLevelUp: number;
            activeSkills: LLSimulateContext_ActiveSkill[];
            lastActiveSkill: LLSimulateContext_LastActiveSkill;
            effects: {[type: number]: number};

            timeToFrame(t: number): number;
            updateNextFrameByMinTime(minTime: number): void;
            processDeactiveSkills(): void;
            getMinDeactiveTime(): void;
            markTriggerActive(memberId: number, bActive: boolean, effectInfo?: LLSimulateContext_EffectStaticInfo): void;
            isSkillNoEffect(memberId: number, effectInfo: LLSimulateContext_EffectStaticInfo): boolean;
            getSkillPossibility(memberId: number, isAccessory: boolean): number;
            onSkillActive(membereId: number, isAccessory: boolean): boolean;
            getNextTriggerChances(): number[];
            getMinTriggerChanceTime(): number;
            makeTriggerData(index: number): LLSimulateContext_Trigger;
            addActiveSkill(effectInfo: LLSimulateContext_EffectStaticInfo, effectTime: number, memberId: number, realMemberId: number, effectValue?: number, syncTarget?: number): LLSimulateContext_ActiveSkill;
            setLastActiveSkill(memberId: number, levelBoost: number, activateFrame: number, isAccessory: boolean): void;
            clearLastActiveSkill(): void;
            setLastFrameForLevelUp(): void;

            simulate(NoteTriggerDataType: Internal.NoteTriggerDataType[], teamData: LLTeam): void;
        }
    }

    namespace Layout {
        namespace Team {
            type IndexType = number; // 0~8
            interface TeamMemberKeyGetSet<T> {
                set(v: T): void;
                get(): T;
            }
            interface TeamAvatarCellController {
                update(cardid: Core.CardIdOrStringType, mezame: Core.MezameType): void;
                getCardId(): Core.CardIdType;
                getMezame(): Core.MezameType;
            }
            interface TeamAccessoryIconCellController extends TeamMemberKeyGetSet<Internal.AccessorySaveDataType> {
                updateAccessoryLevel(level: number): void;
                updateMember(cardid: Core.CardIdOrStringType): void;
                getAccessoryId(): Core.AccessoryIdStringType;
                getAccessoryLevel(): number;
            }
            interface TeamTextCellController extends TeamMemberKeyGetSet<string> {
                reset(): void;
            }
            interface TeamSkillLevelCellController extends TeamMemberKeyGetSet<number> {
                setMaxLevel(maxLevel: number): void;
                onChange?: (i: IndexType, level: number) => void;
            }
            interface TeamRowController<TCellController> {
                headColor?: string; // in
                cellColor?: string; // in
                fold?: () => void; // in
                unfold?: () => void; // in

                cells: TCellController[]; // index 0~8
                show(): void;
                hide(): void;
                toggleFold?: () => void;
            }
            interface LLTeamComponent_Options {
                onPutCardClicked?: (i: IndexType) => void;
                onPutGemClicked?: (i: IndexType) => Internal.NormalGemCategoryKeyType;
                onPutAccessoryClicked?: (i: IndexType) => Internal.AccessorySaveDataType;
                onCenterChanged?: () => void;
            }
            class LLTeamComponent implements Mixin.SaveLoadJson {
                constructor(id: Component.HTMLElementOrId, options: LLTeamComponent_Options);

                putMember(i: IndexType, member?: Internal.MemberSaveDataType): void;
                /** alias of putMember */
                setMember(i: IndexType, member?: Internal.MemberSaveDataType): void;
                setMembers(members?: Internal.MemberSaveDataType[]): void;
                getMember(i: IndexType): Internal.MemberSaveDataType;
                getMembers(): Internal.MemberSaveDataType[];
                setMemberGem(i: IndexType, gem: Model.LLSisGem): void;
                setAccessory(i: IndexType, accessory: Internal.AccessorySaveDataType): void;
                getCardId(i: IndexType): Core.CardIdType;
                getCardIds(): Core.CardIdType[];
                getAccessoryId(i: IndexType): Core.AccessoryIdStringType;
                getAccessoryIds(): Core.AccessoryIdStringType[];
                getWeight(i: IndexType): number;
                getWeights(): number[];
                setWeight(i: IndexType, w: number): void;
                setWeights(weights: number[]): void;
                setSwapper(swapper: TODO.LLSwapper): void;
                getSwapper(): TODO.LLSwapper;
                setMapAttribute(attribute: Core.AttributeType): void;
                isAllMembersPresent(): boolean;

                // results
                setStrengthAttribute(i: IndexType, strength: number): void;
                setStrengthAttributes(strengths: number[]): void;
                setStrengthDebuff(i: IndexType, strength: number): void;
                setStrengthDebuffs(strengths: number[]): void;
                setStrengthCardTheories(strengths: number[]): void;
                setStrengthTotalTheories(strengths: number[]): void;
                setStrengthSkillTheory(i: IndexType, strength: number, strengthSupported: boolean): void;
                setSkillActiveCountSim(i: IndexType, count: number): void;
                setSkillActiveCountSims(counts: number[]): void;
                setSkillActiveChanceSim(i: IndexType, count: number): void;
                setSkillActiveChanceSims(counts: number[]): void;
                setSkillActiveNoEffectSim(i: IndexType, count: number): void;
                setSkillActiveNoEffectSims(counts: number[]): void;
                setSkillActiveHalfEffectSim(i: IndexType, count: number): void;
                setSkillActiveHalfEffectSims(counts: number[]): void;
                setAccessoryActiveCountSim(i: IndexType, count: number): void;
                setAccessoryActiveCountSims(counts: number[]): void;
                setAccessoryActiveChanceSim(i: IndexType, count: number): void;
                setAccessoryActiveChanceSims(counts: number[]): void;
                setAccessoryActiveNoEffectSim(i: IndexType, count: number): void;
                setAccessoryActiveNoEffectSims(counts: number[]): void;
                setAccessoryActiveHalfEffectSim(i: IndexType, count: number): void;
                setAccessoryActiveHalfEffectSims(counts: number[]): void;
                setHeal(i: IndexType, heal: number): void;
                setResult(result: Model.LLTeam): void;

                saveData(): Internal.MemberSaveDataType[];
                loadData(members: Internal.MemberSaveDataType[]): void;

                // callbacks
                onPutCardClicked?: (i: IndexType) => void;
                onPutGemClicked?: (i: IndexType) => Internal.NormalGemCategoryKeyType;
                onPutAccessoryClicked?: (i: IndexType) => Internal.AccessorySaveDataType;
                onCenterChanged?: () => void;

                // implements
                saveJson(): string;
                loadJson(jsonData: string): void;
            }
        }
        namespace Language {

            class LLLanguageComponent extends Component.LLComponentBase {
                constructor(id?: Component.HTMLElementOrId);

                value: Core.LanguageType;
                langSupports: Mixin.LanguageSupport[];

                onValueChange?: (newValue: Core.LanguageType) => void;

                get(): Core.LanguageType;
                set(val: Core.LanguageType): void;
                registerLanguageChange(langSupport: Mixin.LanguageSupport): void;
            }
        }
        namespace ScoreDistParam {
            type ScoreDistType = 'no'|'v1'|'sim';
            interface ScoreDistParamSaveData {
                type: ScoreDistType;
                /** int, simulate count */
                count: number;
                /** float 0~100 */
                perfect_percent: number;
                /** speed int 1~10 */
                speed: number;
                /** 1 for 300 combo, 2 for 220 combo */
                combo_fever_pattern: 1 | 2;
                /** 0 for disabled, 1 for enabled */
                over_heal_pattern: 0 | 1;
                /** 0 for disabled, 1 for enabled */
                perfect_accuracy_pattern: 0 | 1;
                /** 0 for disabled, 1 for enabled */
                trigger_limit_pattern: 0 | 1;
            }
            interface ScoreDistParamController {
                getParameters(): ScoreDistParamSaveData;
                setParameters(params: ScoreDistParamSaveData): void;
            }
            class LLScoreDistributionParameter implements Mixin.SaveLoadJson {
                constructor(id: Component.HTMLElementOrId);

                saveData(): ScoreDistParamSaveData;
                loadData(data: ScoreDistParamSaveData): void;
                
                // implements
                saveJson(): string;
                loadJson(jsonData: string): void;
            }
        }
    }

    class LLData<DataT> {
        constructor(brief_url: string, detail_url: string, brief_keys: string[], version?: string);

        getAllBriefData(keys?: string[], url?: string): Depends.Promise<{[id: string]: DataT}, void>;
        getDetailedData(index: string, url?: string): Depends.Promise<DataT, void>;
        getAllCachedBriefData(): {[id: string]: DataT};
        getCachedDetailedData(index: string): DataT;

        setVersion(version: string): void;
        getVersion(): string;

        private initVersion(version: string): void;
        private version: string;
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
        Accessory: ConstUtil.Accessory;
        Album: ConstUtil.Album;
        Common: ConstUtil.Common;
        Skill: ConstUtil.Skill;
        Attributes: ConstUtil.Attributes;
        // TODO
    }

    namespace Test {
        interface TestItemOptions {
            name: string;
            url?: string;
            after?: Depends.Promise<any, void> | AcceptedTestItem | AcceptedTestItem[];
            cardConfigs?: Core.CardIdType[][];
            version?: "cn" | "latest";
            songId?: Core.SongIdType;
            songSettingId?: Core.SongSettingIdType;
            run(cards: API.CardDictDataType, noteData: API.NoteDataType): Depends.Promise<any, any> | number | string;
        }

        interface AcceptedTestItem extends TestItemOptions {
            defer: Depends.Deferred<any, void>;
            startTime: number;
            finishTime: number;
            start(): Depends.Promise<any, any>;
        }

        interface TestCaseData {
            name: string;
            page: 'llnewunit' | 'llnewunitsis' | 'llnewautounit';
            type: Layout.ScoreDistParam.ScoreDistType;
            version: 'cn' | 'latest';
            songId: Core.SongIdType;
            songSettingId: Core.SongSettingIdType;
            saveData: Internal.UnitSaveDataType;
            map: Model.LLMap_SaveData;
            result: Internal.CalculateResultType;
        }
    }

    namespace TODO {
        type GemStockType = any;
        type LLSwapper = any;
        type LLCSkillComponent = any;
        type LLSkill = any;
    }
}

declare var LLCardData: LLH.LLData<LLH.API.CardDataType>;
declare var LLSongData: LLH.LLData<LLH.API.SongDataType>;
declare var LLSisData: LLH.LLData<LLH.API.SisDataType>;
declare var LLAccessoryData: LLH.LLData<LLH.API.AccessoryDataType>;
declare var LLMetaData: LLH.LLSimpleKeyData<LLH.API.MetaDataType>;

declare var LLDepends: LLH.Depends.Utils;
