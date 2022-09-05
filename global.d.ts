declare namespace LLH {
    namespace Core {
        type AttributeType = 'smile'|'pure'|'cool';
        type AttributeAllType = AttributeType | 'all';
        /** 1 for smile, 2 for pure, 3 for cool, 5 for all */
        type AttributeIdType = 1|2|3|5;
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
        /** 1 for easy, 2 for normal, 3 for hard, 4 for expert, 5 for random, 6 for master */
        type SongDifficultyType = number;
        /** string of integer */
        type SisIdType = string;
        /** float, length 9 */
        type PositionWeightType = string[] | number[];
        /** the string id for accessory */
        type AccessoryIdStringType = string;
        /** the trigger/effect target */
        type TriggerTargetType = MemberTagIdType[];
        type TriggerTargetMemberType = UnitTypeIdType[];

        type MezameType = 0 | 1;
        /** note speed: 1~10 */
        type NoteSpeedType = number;
        /** LLConstValue.NOTE_TYPE_... */
        type NoteEffectType = number;
        /** 1 for 300 combo, 2 for 220 combo */
        type ComboFeverPattern = 1 | 2;
        /** LLConstValue.SKILL_TRIGGER_... */
        type SkillTriggerType = number;
        /** LLConstValue.SKILL_EFFECT_... */
        type SkillEffectType = number;
        /** 0: cn, 1: jp */
        type LanguageType = 0 | 1;
    }
    namespace API {
        /** <value> | "<min>~<max>" */
        type CardDetailRangeType = number | string;
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
            skilleffect: Core.SkillEffectType;
            triggertype: Core.SkillTriggerType;
            skillleveluppattern: number;
            skilldetail: SkillDetailDataType[];

            score_range?: CardDetailRangeType;
            time_range?: CardDetailRangeType;
            triggerrequire?: CardDetailRangeType;
            possibility_range?: CardDetailRangeType;
            limit_range?: CardDetailRangeType;

            triggertarget?: Core.TriggerTargetType; // chain target
            effecttarget?: Core.TriggerTargetType; // attribute up target
        }
        type CardDictDataType = {[id: Core.CardIdStringType]: CardDataType};

        interface SongSettingDataType {
            liveid: string;
            difficulty: Core.SongDifficultyType;
            stardifficulty: number;
            combo: number;
            cscore?: number;
            bscore?: number;
            ascore?: number;
            sscore?: number;
            jsonpath?: string;
            isac: 0|1;
            isswing: 0|1;
            positionweight: Core.PositionWeightType
            positionnote?: string[]; // integer, length 9
            positionslider?: string[]; // integer, length 9
            positionswing?: string[]; // integer, length 9
            positionswingslider?: string[]; // integer, length 9
            star: string; // integer
            slider?: string; // integer
            swing?: string; // integer
            swingslider?: string; // integer
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
            bpm?: string; // float
        }
        type SongDictDataType = {[id: string]: SongDataType};

        interface NoteDataType {
            timing_sec: number; // float
            notes_level: number;
            effect: Core.NoteEffectType;
            effect_value: number; // float, hold time
            position: number; // 1~9, 1 for right most, 9 for left most
        }

        interface SisDataType {
            id: Core.SisIdType;
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
        type SisDictDataType = {[id: Core.SisIdType]: SisDataType};
        
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
            cskill_groups: Core.MemberTagIdType[];
        }

        interface AccessoryLevelDataType {
            level: number;
            effect_value: number;
            trigger_value?: number;
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
            /** none for normal accessory trigger */
            trigger_type?: number;
            /** for charged spark skill */
            trigger_effect_type?: number;
            default_max_level: number; // usually 4
            max_level: number; // usually 8
            icon_asset: string;
            effect_target?: Core.TriggerTargetMemberType;
            levels?: AccessoryLevelDataType[];
            unit_id?: Core.CardIdStringType;
        }
        type AccessoryDictDataType = {[id: Core.AccessoryIdStringType]: AccessoryDataType};

    }

    namespace Callback {
        type Action = () => void;
        type Consumer<T> = (x: T) => void;
        type Supplier<T> = () => T;
    }

    namespace Internal {
        /** LLConstValue.SONG_DEFAULT_SET_... */
        type DefaultSongSetIdType = number;

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
            main_attribute: Core.AttributeAllType;
            type: string;
            unit_type_id?: Core.UnitTypeIdType;
        }
        type ProcessedAccessoryDictDataType = {[id: Core.AccessoryIdStringType]: ProcessedAccessoryDataType};


        type NormalGemCategoryIdType = number;
        type NormalGemCategoryKeyType = string;
        /** 1 for self, 2 for team */
        type NormalGemCategoryEffectRangeType = 1 | 2;
        interface NormalGemMetaType {
            /** en name */
            name: string;
            /** cn name */
            cnname: string;
            key: NormalGemCategoryKeyType;
            slot: number;
            effect_range: NormalGemCategoryEffectRangeType;
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
            laGemList: Core.SisIdType[];
            accessory?: AccessorySaveDataType;
        }

        interface MemberMetaDataType {
            color?: Core.AttributeAllType;
            name?: string;
            cnname?: string;
            background_color?: string;
            grade?: Core.GradeType;
            member_gem?: boolean;
        }

        interface UnitSaveDataTypeV104 {
            version: 104;
            team: MemberSaveDataType[];
            gemstock: TODO.GemStockType;
            submember: SubMemberSaveDataType[];
        }
        type UnitSaveDataType = UnitSaveDataTypeV104;
        type UnitAnySaveDataType = UnitSaveDataTypeV104;

        interface CalculateResultType {
            attrStrength: number[];
            finalAttr: AttributesValue;
            bonusAttr: AttributesValue;
            totalStrength: number;
            totalAttrStrength: number;
            totalSkillStrength: number;
            totalHP: number;
            averageHeal: number;
            averageDamage: number;
            averageOverHealLevel: number;
            averageAccuracyNCoverage: number;
            averageSkillsActiveCount: number[];
            averageSkillsActiveChanceCount: number[];
            averageSkillsActiveNoEffectCount: number[];
            averageSkillsActiveHalfEffectCount: number[];
            averageAccessoryActiveCount: number[];
            averageAccessoryActiveChanceCount: number[];
            averageAccessoryActiveNoEffectCount: number[];
            averageAccessoryActiveHalfEffectCount: number[];
            averageLABonus: number;
            naivePercentile: number[];
            naiveExpection: number;
            probabilityForMinScore: number;
            probabilityForMaxScore: number;
            minScore: number;
            maxScore: number | string;
            simulateScoreResults: SimulateScoreResult[];
            equivalentURLevel: number;
            micNumber: number;
            failRate: number;
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

        interface SimulateScoreResult {
            score: number;
            count: number;
        }

        type SimulateMode = 'sim' | 'simla';

        type PoolType = 'card' | 'song' | 'accessory';

        interface PoolSaveDataType<IdType> {
            name: string;
            items: IdType[];
        }

        type PoolsSaveDataType<IdType> = PoolSaveDataType<IdType>[];

    }

    namespace Depends {
        interface PromiseBase<
            DoneT1, FailT1,
            DoneT2 = never, FailT2 = never,
            DoneT3 = never, FailT3 = never,
            DoneT4 = never, FailT4 = never,
            DoneT5 = never, FailT5 = never> {
                then<DoneU1 = never, FailU1 = never,
                    DoneU2 = never, FailU2 = never,
                    DoneU3 = never, FailU3 = never,
                    DoneU4 = never, FailU4 = never,
                    DoneU5 = never, FailU5 = never,
                    DoneV1 = never, FailV1 = never,
                    DoneV2 = never, FailV2 = never,
                    DoneV3 = never, FailV3 = never,
                    DoneV4 = never, FailV4 = never,
                    DoneV5 = never, FailV5 = never>
                    (
                        doneCallback: (arg1: DoneT1, arg2: DoneT2, arg3: DoneT3, arg4: DoneT4, arg5: DoneT5) =>
                            PromiseBase<DoneU1, FailU1, DoneU2, FailU2, DoneU3, FailU3, DoneU4, FailU4, DoneU5, FailU5> | DoneU1,
                        failCallback?: (arg1: FailT1, arg2: FailT2, arg3: FailT3, arg4: FailT4, arg5: FailT5) =>
                            PromiseBase<DoneV1, FailV1, DoneV2, FailV2, DoneV3, FailV3, DoneV4, FailV4, DoneV5, FailV5> | DoneV1
                    ):
                        PromiseBase<DoneU1 | DoneV1, FailU1 | FailV1,
                            DoneU2 | DoneV2, FailU2 | FailV2,
                            DoneU3 | DoneV3, FailU3 | FailV3,
                            DoneU4 | DoneV4, FailU4 | FailV4,
                            DoneU5 | DoneV5, FailU5 | FailV5>;
        }
        type Promise<DoneT, FailT> = PromiseBase<DoneT, FailT>;
        // interface Promise<DoneT, FailT> {
        //     then<DoneU, FailU>(doneCallback: (arg: DoneT) => DoneU, failCallback?: (arg: FailT) => FailU): Promise<DoneU, FailU>;
        // }
        interface Deferred<DoneT, FailT> extends Promise<DoneT, FailT> {
            resolve(arg?: DoneT): void;
            reject(arg?: FailT): void;
        }

        interface Utils {
            createDeferred<DoneT, FailT>(): Deferred<DoneT, FailT>;
            whenAll<DoneT1, FailT1, DoneT2, FailT2, DoneT3, FailT3>(
                promise1: Promise<DoneT1, FailT1>,
                promise2: Promise<DoneT2, FailT2>,
                promise3: Promise<DoneT3, FailT3>): PromiseBase<DoneT1, FailT1, DoneT2, FailT2, DoneT3, FailT3>;
            whenAll(...args: Promise<any, any>[]): Promise<any, any>;
            whenAllByArray(arr: Promise<any, any>[]): Promise<any, any>;
        }
    }

    namespace Mixin {
        interface SaveLoadJson {
            saveJson(): string;
            loadJson(jsonData?: string): void;
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
        type HTMLElementOrString = string | HTMLElement;
        type SubElements = HTMLElementOrString | (HTMLElementOrString | undefined | (HTMLElementOrString | undefined)[])[];
        type BootCssColorStyleType = 'default' | 'primary' | 'success' | 'info' | 'warning' | 'danger';
        // type OptionalStyle = {[k: keyof CSSStyleDeclaration]: string};
        interface OptionalStyle {
            color?: string;
            display?: string;
            float?: string;
            height?: string;
            marginLeft?: string;
            marginRight?: string;
            marginTop?: string;
            maxHeight?: string;
            overflowY?: string;
            padding?: string;
            textAlign?: string;
            width?: string;
            zIndex?: string;
        }
        interface CreateElementOptions {
            className?: string;
            innerHTML?: string;
            style?: OptionalStyle;
            type?: string;
            href?: string;
            title?: string;
            value?: string;
            step?: string;
            size?: number;
            max?: string;
            min?: string;
            autocomplete?: string;
            scope?: string;
            border?: string;
            src?: string;
        }

        interface LLComponentBase_Options {
            listen?: {[e: string]: (event: Event) => void};
        }
        class LLComponentBase<ElementType extends HTMLElement = HTMLElement> implements Mixin.SaveLoadJson {
            constructor(id?: ElementType | string, options?: LLComponentBase_Options);

            id?: string;
            exist: boolean;
            visible: boolean;
            element?: ElementType;

            show(): void;
            hide(): void;
            toggleVisible(): void;
            setVisible(visible: boolean): void;
            setClassName(newClassName: string): void;
            setTooltips(tooltips: string): void;
            serialize(): any;
            deserialize(data: any): void;
            on(eventName: string, callback: (event: Event) => void): void;
            isInDocument(): boolean;

            // implements
            saveJson(): string;
            loadJson(jsonData?: string): void;
        }
        interface LLValuedComponent_Options extends LLComponentBase_Options {
            valueKey?: string;
        }
        class LLValuedComponent<ElementType extends HTMLElement = HTMLElement> extends LLComponentBase<ElementType> {
            constructor(id?: ElementType | string, options?: LLValuedComponent_Options);

            value?: string;
            valueKey: string;
            onValueChange?: (newValue: string) => void;

            get(): string;
            set(val: string): void;

            override serialize(): string;
            override deserialize(data: string): void;
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
        class LLSelectComponent extends LLValuedComponent<HTMLSelectElement> {
            constructor(id: HTMLSelectElement | string, options?: LLValuedComponent_Options);

            options: LLSelectComponent_OptionDef[];
            filteredOptions: LLSelectComponent_OptionDef[];
            filter?: LLSelectComponent_FilterCallback;

            setOptions(options: LLSelectComponent_OptionDef[], filter?: LLSelectComponent_FilterCallback): void;
            filterOptions(filter?: LLSelectComponent_FilterCallback): void;

            override set(val: string): void;
        }
        interface LLImageComponent_Options extends LLComponentBase_Options {
            srcList?: string[];
        }
        class LLImageComponent extends LLComponentBase<HTMLImageElement> {
            constructor(id: HTMLImageElement | string, options?: LLImageComponent_Options);
            
            srcList: string[];
            curSrcIndex?: number;

            setSrcList(newSrcList: string[]): void;
            setAltText(text: string): void;
        }
        interface LLAvatarComponent_Options extends LLComponentBase_Options {
            id?: HTMLImageElement | string;
            cardId?: Core.CardIdStringType;
            mezame?: boolean;
            smallAvatar?: boolean;
        }
        class LLAvatarComponent extends LLImageComponent {
            constructor(options: LLAvatarComponent_Options);

            setCard(cardId?: Core.CardIdStringType, mezame?: boolean | Core.MezameType): void;
            getCardId(): Core.CardIdStringType | undefined;
            getMezame(): boolean;
        }
        interface LLButtonComponent_Options {
            id?: HTMLButtonElement | string;
            click?: (event: Event) => void;
            text?: string;
            colorStyle?: BootCssColorStyleType;
            tooltips?: string;
            style?: Component.OptionalStyle;
        }
        class LLButtonComponent extends LLComponentBase<HTMLButtonElement> {
            constructor(options: LLButtonComponent_Options);

            setEnabled(enabled: boolean): void;
            setText(text: string): void;
        }
        interface LLDialogComponent_Options {
            height?: string;
            width?: string;
            content: SubElements;
            closeCallback?: Callback.Action;
        }
        class LLDialogComponent {
            constructor(options: LLDialogComponent_Options);

            close(): void;

            static openDialog(options: LLDialogComponent_Options): LLDialogComponent;
        }
        interface LLYesNoDialogComponent_Options {
            question: SubElements;
            title?: SubElements;
            answerCallback?: Callback.Consumer<boolean>;
        }
        class LLYesNoDialogComponent extends LLDialogComponent {
            constructor(options: LLYesNoDialogComponent_Options);

            static openYesNoDialog(options: LLYesNoDialogComponent_Options): LLYesNoDialogComponent;
        }
        interface LLAccessoryComponent_Options extends LLComponentBase_Options {
            size?: number // in pixel, default 128
        }
        class LLAccessoryComponent extends LLComponentBase {
            constructor(id: HTMLElementOrId, options?: LLAccessoryComponent_Options);

            accessoryId?: Core.AccessoryIdStringType;
            size: number;
            accessoryImage: LLImageComponent;

            setAccessory(newAccessory?: Core.AccessoryIdStringType | API.AccessoryDataType, language?: Core.LanguageType): void;
        }
        class LLComponentCollection implements Mixin.SaveLoadJson {
            constructor();

            components: {[name: string]: LLComponentBase};

            add(name: string, component: LLComponentBase): void;
            getComponent(name: string): LLComponentBase | undefined;
            serialize(): any;
            deserialize(data: any): void;
            saveJson(): string;
            loadJson(json?: string): void;
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
            currentOptionGroup?: string;
            affectOptionGroupFilters?: string[];
        }
        class LLFiltersComponent extends LLComponentCollection {
            constructor();

            filters: {[name: string]: LLFiltersComponent_FilterDef};
            freeze: boolean;
            onValueChange?: (name: string, newValue: string) => void;

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

    namespace Persistence {
        interface LLHelperLocalStorage {
            getDataVersion(): string;
            setDataVersion(v: string): void;
            getData(key: string, defaultValue?: string): string | undefined;
            setData(key: string, value: string): void;
            clearData(key: string): void;
        }

        interface SaveLoadJsonConfig {
            key: string;
            serializable: Mixin.SaveLoadJson;
            defaultJson?: string;
            skipClear?: boolean;
        }
        
        class LLSaveLoadJsonGroup {
            constructor();

            groups: SaveLoadJsonConfig[];

            register(key: string, serializable: Mixin.SaveLoadJson, defaultJson?: string, skipClear?: boolean): void;
            loadAll(): void;
            saveAll(): void;
            clearAll(): void;
        }
    }

    namespace Controller {
        interface ControllerBase {
            element: Component.SubElements;
        }
        interface ClickableController {
            onClick?: () => void;
        }
    }

    namespace Table {
        interface LLCardTableComponent_RowController extends Controller.ControllerBase, Controller.ClickableController {
            setCardData(card?: API.CardDataType): void;
            setSelected(selected: boolean): void;
            isSelected(): boolean;
            getCardId(): Core.CardIdStringType | undefined;
        }
        interface LLCardTableComponent_PageButtonController extends Controller.ControllerBase {
            element: HTMLElement;

            setActive(active: boolean): void;
        }
        interface LLCardTableComponent_PaginationController extends Controller.ControllerBase {
            setPageCount(count: number): void;
            getSelectedPage(): number;

            onPageChange?: (page: number) => void;
        }
        interface LLCardTableComponent_CardInfo {
            cardId: Core.CardIdStringType;
            selected: boolean;
        }
        interface LLCardTableComponent_Options {
            id?: Component.HTMLElementOrId;
            cards: API.CardDictDataType;
            /** enabled when selected any item */
            toolbarButtons?: Component.LLButtonComponent[];
            /** always enabled buttons */
            toolbarEnabledButtons?: Component.LLButtonComponent[];
        }
        class LLCardTableComponent extends Component.LLComponentBase {
            constructor(options: LLCardTableComponent_Options);

            element: HTMLElement;

            setCardList(newCardIds: Core.CardIdStringType[]): void;
            getSelectedCardList(): Core.CardIdStringType[];
            selectAll(isPage?: boolean): void;
            selectNone(isPage?: boolean): void;
            selectReverse(isPage?: boolean): void;
        }
    }

    namespace Pool {
        interface PoolProcessedDataType<IdType> {
            raw: Internal.PoolSaveDataType<IdType>
            itemSet: Set<IdType>;
        }
        type PoolsProcessedDataType<IdType> = PoolProcessedDataType<IdType>[];
        interface LLPoolUtil {
            loadRawPools<IdType>(storageKey: string): Internal.PoolsSaveDataType<IdType>;
            loadPools<IdType>(storageKey: string): PoolsProcessedDataType<IdType>;
            processPool<IdType>(rawPool: Internal.PoolSaveDataType<IdType>): PoolProcessedDataType<IdType>;
            saveRawPools<IdType>(storageKey: string, rawPools: Internal.PoolsSaveDataType<IdType>): void;
            savePools<IdType>(storageKey: string, pools: PoolsProcessedDataType<IdType>): void;
            /** return error message if fail, or empty string if success */
            addPool<IdType>(pools: PoolsProcessedDataType<IdType>, newPoolName: string): string;
            /** return error message if fail, or empty string if success */
            removePoolByIndex<IdType>(pools: PoolsProcessedDataType<IdType>, index: number): void;
        }
        type CardPoolProcessedDataType = PoolProcessedDataType<Core.CardIdStringType>;
        type CardPoolsProcessedDataType = PoolsProcessedDataType<Core.CardIdStringType>;
        interface LLCardPoolComponent_Options {
            id?: Component.HTMLElementOrId;
            poolsKey: string;
            cards: API.CardDictDataType;
        }

        interface LLCardPoolComponent_PoolsSelectController extends Controller.ControllerBase {
            getPools(): CardPoolsProcessedDataType;
            getSelectedPool(): CardPoolProcessedDataType | undefined;
            /** return number of new cards added */
            addCardsToSelectedPool(cardIds: Core.CardIdStringType[]): number;
            /** return number of cards */
            replaceCardsToSelectedPool(cardIds: Core.CardIdStringType[]): number;
            /** return number of removed cards */
            removeCardsFromSelectedPool(cardIds: Core.CardIdStringType[]): number;
            removeSelectedPool(): void;

            onPoolSelectChange?: (pool?: CardPoolProcessedDataType) => void;
            onPoolSave?: (pool: CardPoolProcessedDataType) => void;
        }
        class LLCardPoolComponent implements Mixin.LanguageSupport {
            constructor(options: LLCardPoolComponent_Options);

            controller: LLCardPoolComponent_PoolsSelectController;
            pools: CardPoolsProcessedDataType;
            cardSelector: Selector.LLCardSelectorComponent;
        }
    }

    namespace Selector {
        interface LLCardSelectorComponent_Options {
            cards: API.CardDictDataType;
            noShowN?: boolean;
            pools?: Pool.CardPoolsProcessedDataType;
        }
        type LLCardSelectorComponent_OnCardChangeCallback = (cardId: Core.CardIdOrStringType) => void;
        class LLCardSelectorComponent extends Component.LLFiltersComponent implements Mixin.LanguageSupport {
            constructor(id: Component.HTMLElementOrId, options: LLCardSelectorComponent_Options);

            /** album group id to members type id mapping */
            albumGroupMemberCache: {[albumGroupId: string]: Core.UnitTypeIdType[]};
            cards: API.CardDictDataType;

            setCardData(cards: API.CardDictDataType, resetCardSelection?: boolean): void;
            getCardId(): Core.CardIdOrStringType;
            getFilteredCardIdList(): Core.CardIdStringType[];
            updatePoolsOptions(): void;
            scrollIntoView(): void;

            // optional callback
            onCardChange?: LLCardSelectorComponent_OnCardChangeCallback;

            // implements LanguageSupport
            setLanguage(language: Core.LanguageType): void;
        }
        interface LLSongSelectorComponent_Options {
            songs: API.SongDictDataType;
            excludeDefaultSong?: boolean;
            includeMapInfo?: boolean;
            friendCSkill?: Layout.CenterSkill.LLCSkillComponent;
            mode?: Layout.LayoutMode;
        }
        class LLSongSelectorComponent extends Component.LLFiltersComponent implements Mixin.LanguageSupport {
            constructor(id: Component.HTMLElementOrId, options: LLSongSelectorComponent_Options)

            songs: API.SongDictDataType;
            songSettings: Internal.ProcessedSongSettingDictDataType;
            includeMapInfo: boolean;
            mode: Layout.LayoutMode;
            friendCSkill?: Layout.CenterSkill.LLCSkillComponent;

            setSongData(songs: API.SongDictDataType, includeDefaultSong?: boolean): void;

            getSelectedSongId(): Core.SongIdType;
            getSelectedSong(): API.SongDataType;
            getSelectedSongSettingId(): Core.SongSettingIdType;
            getSelectedSongSetting(): Internal.ProcessedSongSettingDataType;
            getSongAttribute(): Core.AttributeAllType;
            getMap(customWeight: Core.PositionWeightType): Model.LLMap;

            // private
            updateMapInfo(songSetting: Internal.ProcessedSongSettingDataType): void;

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
            showBrief: boolean;
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
            getGemId(): Core.SisIdType | Internal.NormalGemCategoryKeyType;

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
            getBigGroupId(memberId: Core.MemberIdType): Core.BigGroupIdType | undefined;
            /** return undefined if not nonet team, or big group id of the nonet team */
            isNonetTeam(members: Model.LLMember[]): Core.BigGroupIdType | undefined;
            /** return undefined if not same color team, or color of the team */
            isSameColorTeam(members: Model.LLMember[]): Core.AttributeAllType | undefined;
            getMemberGrade(memberId: Core.MemberIdType): Core.GradeType | undefined;
            getMemberTypeIdsInGroups(groups?: Core.MemberTagIdType[] | Core.MemberTagIdType): Core.UnitTypeIdType[];
            getMemberColor(member: Core.MemberIdType): Core.AttributeAllType | undefined;
            getMemberBackgroundColor(member: Core.MemberIdType): string;
        }
        interface Group {
            getBigGroupIds(): Core.BigGroupIdType[];
            getGroupName(groupId: Core.MemberTagIdType): string;
        }
        interface GemType {
            SADD_200: number;
            SADD_450: number;
            SMUL_10: number;
            SMUL_16: number;
            AMUL_18: number;
            AMUL_24: number;
            SCORE_250: number;
            HEAL_480: number;
            EMUL_33: number;
            SADD_1400: number;
            SMUL_28: number;
            AMUL_40: number;
            MEMBER_29: number;
            NONET_42: number;
            MEMBER_13: number;
            MEMBER_21: number;
            MEMBER_53: number;
            NONET_15: number;
        }
        interface Gem {
            getMemberGemList(): Core.UnitTypeIdType[];
            getUnitGemList(): Core.MemberTagIdType[];
            isMemberGemExist(memberId: Core.MemberIdType): boolean;
            getNormalGemMeta(typeOrMeta: Internal.NormalGemCategoryIdOrMetaType): Internal.NormalGemMetaType | undefined;
            getNormalGemTypeKeys(): Internal.NormalGemCategoryKeyType[];
            getNormalGemName(typeOrMeta: Internal.NormalGemCategoryIdOrMetaType): string | undefined;
            getNormalGemBriefDescription(typeOrMeta: Internal.NormalGemCategoryIdOrMetaType): string | undefined;
            getNormalGemNameAndDescription(typeOrMeta: Internal.NormalGemCategoryIdOrMetaType): string;
            /** true if gem color should follow member attribute, false if follow map attribute */
            isGemFollowMemberAttribute(typeOrMeta: Internal.NormalGemCategoryIdOrMetaType): boolean;

            getGemBriefDescription(gemData: API.SisDataType, iscn?: boolean): string;
            getGemDescription(gemData: API.SisDataType, iscn?: boolean): string;
            getGemFullDescription(gemData: API.SisDataType, iscn?: boolean): string;
            getGemColor(gemData: API.SisDataType): string;

            postProcessGemData(gemData: API.SisDictDataType): void;
        }
        interface Album {
            getAlbumGroupByAlbumId(albumId: Core.AlbumIdType): Internal.ProcessedAlbumGroupType | undefined;
            getAlbumGroups(): Internal.ProcessedAlbumGroupType[];
            isAlbumInAlbumGroup(albumId: Core.AlbumIdType, albumGroupId: Internal.AlbumGroupIdType): boolean;
        }
        interface Accessory {
            postProcessAccessoryData(accessoryData: API.AccessoryDictDataType, cardData: API.CardDictDataType): Internal.ProcessedAccessoryDictDataType;
            postProcessSingleAccessoryData(accessoryData: API.AccessoryDataType, cardData: API.CardDictDataType): Internal.ProcessedAccessoryDataType;
            
            getAccessoryDescription(accessoryData: Internal.ProcessedAccessoryDataType, language?: Core.LanguageType): string;
            getAccessoryMainAttribute(accessory: API.AccessoryDataType): Core.AttributeAllType;
            getAccessoryType(accessory: API.AccessoryDataType): string;
            getAccessoryLevelAttribute(accessory: API.AccessoryDataType, level: number): Internal.AttributesValue;

            canEquipAccessory(accessory: API.AccessoryDataType, level: number, cardId: Core.CardIdOrStringType): boolean;
        }
        interface Common {
            getRarityString(rarity: Core.RarityNumberType): Core.RarityStringType | undefined;
            getAttributeColor(attribute: Core.AttributeAllType): string;
            /** return 1.0~3.0 */
            getOverHealLevelBonus(maxHP: number, overHealLevel: number): number;
            getDefaultMaxSlot(rarity: Core.RarityStringType): number;
            getDefaultMinSlot(rarity: Core.RarityStringType): number;
            getCSkillGroups(): Core.MemberTagIdType[];
            getCardDescription(card: API.CardDataType, language: Core.LanguageType, mezame?: boolean): string;
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
            getTriggerTargetDescription(targets?: Core.TriggerTargetType): string;
            getTriggerTargetMemberDescription(targets: Core.TriggerTargetMemberType): string;
            getTriggerLimitDescription(triggerLimit?: API.CardDetailRangeType): string;
            getTriggerDescription(triggerType: Core.SkillTriggerType, triggerValue?: API.CardDetailRangeType, triggerTarget?: Core.TriggerTargetType, triggerEffectType?: number): string;
            getEffectDescription(effectType: Core.SkillEffectType, effectValue?: API.CardDetailRangeType, dischargeTime?: API.CardDetailRangeType, effectTarget?: Core.TriggerTargetType, effectTargetMember?: Core.TriggerTargetMemberType): string;
            getRateDescription(rate: number): string;

            getEffectBrief(effectType?: Core.SkillEffectType): string;

            getSkillTriggerText(skill_trigger?: Core.SkillTriggerType): string;
            getSkillTriggerUnit(skill_trigger?: Core.SkillTriggerType): string;

            /** level base 0 */
            getCardSkillDescription(card: API.CardDataType, level: number): string;
            /** level base 0 */
            getAccessorySkillDescription(accessory: API.AccessoryDataType, level: number): string;

            isStrengthSupported(card: API.CardDataType): boolean;
        }
        interface Live {
            getNoteAppearTime(noteTimeSec: number, speed: Core.NoteSpeedType): number;
            getDefaultSpeed(difficulty: Core.SongDifficultyType): Core.NoteSpeedType;
            isHoldNote(note_effect: Core.NoteEffectType): boolean;
            isSwingNote(note_effect: Core.NoteEffectType): boolean;
            getComboScoreFactor(combo: number): number;
            getComboFeverBonus(combo: number, pattern: Core.ComboFeverPattern): number;
        }
        interface Song {
            getSongGroupShortName(song_group: Core.SongGroupIdType): string;
            getSongGroupIds(): Core.SongGroupIdType[];
            getGroupForSongGroup(song_group: Core.SongGroupIdType): Core.BigGroupIdType | undefined;
            getDefaultSongSetIds(): Internal.DefaultSongSetIdType[];
            getSongDifficultyName(diff: Core.SongDifficultyType, language: Core.LanguageType): string;
            getDefaultSong(song_group: Core.SongGroupIdType, default_set: Internal.DefaultSongSetIdType): API.SongDataType;
            getDefaultSongSetting(song_group: Core.SongGroupIdType, default_set: Internal.DefaultSongSetIdType): API.SongSettingDataType;
        }
    }

    namespace Misc {
        class LLMapNoteData {
            constructor(baseUrl?: string);

            baseUrl: string;
            cache: {[jsonPath: string]: API.NoteDataType[]};

            getMapNoteData(song: API.SongDataType, songSetting: API.SongSettingDataType): Depends.Promise<API.NoteDataType[], void>;
            getLocalMapNoteData(song: API.SongDataType, songSetting: API.SongSettingDataType): Depends.Promise<API.NoteDataType[], void>;
        }

        type ImageServerIdType = number;
        type ImageServerChangeCallback = () => void;
        interface LLImageServerSwitch_Servers {
            AVATAR_SERVER_GIT: ImageServerIdType;
            AVATAR_SERVER_LOCAL: ImageServerIdType;
        }
        interface LLImageServerSwitch extends LLImageServerSwitch_Servers {
            getImageServer(): ImageServerIdType;
            changeImageServer(): void;
            registerCallback(key: string | Component.LLComponentBase, callback: ImageServerChangeCallback): void;
            initImageServerSwitch(id: Component.HTMLElementOrId): void;
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
            getAttributeType(): Core.AttributeType | undefined;
            setAttributeType(newAttribute: Core.AttributeType): void;

            static getGemSlot(type: Internal.NormalGemCategoryIdType): number;
            static getGemStockCount(gemStock: TODO.GemStockType, gemStockKeys: string[]): number;

            type: Internal.NormalGemCategoryIdType;
            color?: Core.AttributeType;
            grade?: Core.GradeType;
            member?: Core.MemberIdType;
            unit?: Core.BigGroupIdType;
            meta: Internal.NormalGemMetaType;
            gemStockKeys?: string[];
        }
        interface LLSkill_Buff {
            gemskill?: boolean;
            /** percentage */
            skillup?: number;
        }
        class LLSkill {
            constructor(card: API.CardDataType, level: number, buff: LLSkill_Buff);

            setScoreGem(has?: boolean): void;
            setSkillPossibilityUp(rate?: number): void;
            reset(): void;
            isScoreTrigger(): boolean;
            calcSkillChance(env): boolean;
            calcSkillEffect(env): void;
            calcSkillStrength(scorePerStrength: number): void;
            calcSkillDist(): number[];
            isEffectHeal(): boolean;
            isEffectScore(): boolean;

            // TODO: properties
        }

        class LLCommonSisGem {
            constructor(gemData: API.SisDataType);

            gemData: API.SisDataType;
        }

        interface LLMap_Options {
            song?: LLH.API.SongDataType;
            songSetting?: LLH.API.SongSettingDataType;
            friendCSkill?: Internal.CSkillDataType;
        }
        interface LLMap_SaveData {
            attribute: Core.AttributeAllType;
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
            songUnit?: Core.BigGroupIdType;
            /** int 1~10 */
            speed?: number;
            combo_fever_pattern?: 1 | 2;
            combo_fever_limit?: 1000 | 2147483647;
            over_heal_pattern?: 0 | 1;
            perfect_accuracy_pattern?: 0 | 1;
            trigger_limit_pattern?: 0 | 1;

            /** LA only, percentage */
            debuff_skill_rate_down?: number;
            /** LA only */
            debuff_hp_down_value?: number;
            /** LA only, seconds */
            debuff_hp_down_interval?: number;

            simMode?: Internal.SimulateMode;
        }
        class LLMap implements Mixin.SaveLoadJson {
            constructor(options?: LLMap_Options);
            setSong(song: API.SongDataType, songSetting: API.SongSettingDataType): void;
            setAttribute(attribute: Core.AttributeAllType): void;
            setWeights(weights: Core.PositionWeightType): void;
            setSongDifficultyData(combo: number, star: number, time: number, perfect?: number, starPerfect?: number): void;
            setMapBuff(tapup: number, skillup: number): void;
            setLADebuff(skillRateDown: number, hpDownValue: number, hpDownInterval: number): void;
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
            gemDataDict?: API.SisDictDataType;
            enableLAGem?: boolean;
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
            laGems: LLCommonSisGem[];
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
            calcAttrWithGem(mapcolor: Core.AttributeAllType, teamgem: LLSisGem[][]): number;
            calcAttrWithCSkill(mapcolor: Core.AttributeAllType, cskills: Internal.CSkillDataType[]): void;
            getAttrBuffFactor(mapcolor: Core.AttributeAllType, mapunit?: Core.BigGroupIdType): number;
            getAttrDebuffFactor(mapcolor: Core.AttributeAllType, mapunit: Core.BigGroupIdType | undefined, weight: number, totalweight: number): number;
            calcAttrDebuff(mapdata: LLMap_SaveData, pos: number, teamattr: number): number;
            getMicPoint(): number;
            calcTotalCSkillPercentageForSameColor(mapcolor: Core.AttributeType, cskills: Internal.CSkillDataType[]): number;
            getGrade(): Core.GradeType;
            getSkillDetail(levelBoost?: number): API.SkillDetailDataType | undefined;
            getAccessoryDetail(levelBoost?: number): API.AccessoryLevelDataType | undefined;
        }

        class LLTeam {
            constructor(members: LLMember[]);

            members: LLMember[];

            /** set after calculateAttributeStrength() */
            attrDebuff: number[];
            totalAttrNoAccuracy: number;
            totalAttrWithAccuracy: number;
            totalWeight: number[];
            /** set after calculateSkillStength() */
            avgSkills: LLSkill[];
            maxSkills: LLSkill[];
            averageScoreNumber: number;
            averageScore: number | string;
            maxScoreNumber: number;
            maxHeal: number;
            /** set after calculateScoreDistribution() */
            scoreDistribution: number[];
            scoreDistributionMinScore: number;

            calculateResult: Internal.CalculateResultType;

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
        type LLSimulateContext_ChainTypeIdBitsType = {[typeId: Core.UnitTypeIdType]: number};
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
            chainTypeIdBits?: LLSimulateContext_ChainTypeIdBitsType;
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
        interface LLSimulateContext_HP {
            /** 0~totalHP */
            currentHP: number;
            /** 0~totalHP */
            overHealHP: number;
            overHealLevel: number;
            overHealBonus: number;
            totalHealValue: number;
            totalDamageValue: number;
            frameHeal: number;
        }
        class LLSimulateContextStatic {
            constructor(mapdata: LLMap_SaveData, team: LLTeam, maxTime: number);

            simMode: Internal.SimulateMode;
            
            members: LLMember[];
            totalHP: number;
            totalNote: number;
            totalTime: number;
            totalPerfect: number;
            mapSkillPossibilityUp: number;
            mapTapScoreUp: number;
            comboFeverPattern: Core.ComboFeverPattern;
            comboFeverLimit: number;
            perfectAccuracyPattern: number;
            overHealPattern: number;
            triggerLimitPattern: number;
            /** percentage 0~100 */
            skillPosibilityDownFixed: number;
            debuffHpDownValue: number;
            debuffHpDownInterval: number;
            hasRepeatSkill: boolean;
            memberBonusFactor: number[];
            nonetTeam?: Core.BigGroupIdType;
            sameColorTeam?: Core.AttributeType;

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
            /** seconds */
            currentTime: number;
            currentFrame: number;
            currentNote: number;
            currentCombo: number;
            currentScore: number;
            currentPerfect: number;
            currentStarPerfect: number;
            currentHPData: LLSimulateContext_HP;
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
            isAccuracyState: boolean;
            isFullCombo: boolean;
            /** seconds, time when hp dropped to 0 */
            failTime?: number;
            /** 1.0~ */
            laGemTotalBonus: number;

            timeToFrame(t: number): number;
            updateNextFrameByMinTime(minTime: number): void;
            setFailTime(t: number): void;

            processDeactiveSkills(): void;
            getMinDeactiveTime(): void;
            markTriggerActive(memberId: number, bActive: boolean, effectInfo?: LLSimulateContext_EffectStaticInfo): void;
            isSkillNoEffect(memberId: number, effectInfo: LLSimulateContext_EffectStaticInfo): boolean;
            getSkillPossibility(memberId: number, isAccessory: boolean): number;
            onSkillActive(membereId: number, isAccessory: boolean): boolean;
            getNextTriggerChances(): number[];
            getMinTriggerChanceTime(): number;
            makeTriggerData(index: number): LLSimulateContext_Trigger | undefined;
            addActiveSkill(effectInfo: LLSimulateContext_EffectStaticInfo, effectTime: number, memberId: number, realMemberId: number, effectValue?: number, syncTarget?: number): LLSimulateContext_ActiveSkill;
            setLastActiveSkill(memberId: number, levelBoost: number, activateFrame: number, isAccessory: boolean): void;
            clearLastActiveSkill(): void;
            setLastFrameForLevelUp(): void;
            updateAccuracyState(): void;

            updateHP(delta: number): void;
            commitHP(): void;
            isFullHP(): boolean;
            isZeroHP(): boolean;

            updateLAGemTotalBonus(): void;
            calculateLAGemTotalBonus(): number;
            isLAGemTakeEffect(laGem: API.SisDataType): boolean;

            setFullCombo(): void;

            simulate(NoteTriggerDataType: Internal.NoteTriggerDataType[], teamData: LLTeam): void;
        }

        class LLSaveData {
            constructor(data: Internal.UnitAnySaveDataType);

            rawData: Internal.UnitAnySaveDataType;
            rawVersion: number;
            teamMember: Internal.MemberSaveDataType[];
            gemStock: TODO.GemStockType;
            hasGemStock: boolean;
            subMember: Internal.SubMemberSaveDataType[];

            serializeV104(excludeTeam: boolean, excludeGemStock: boolean, excludeSubMember: boolean): Internal.UnitSaveDataTypeV104;
        }
    }

    namespace Layout {
        /** default 'normal' */
        type LayoutMode = 'normal' | 'la';

        namespace Team {
            type IndexType = number; // 0~8
            interface TeamMemberKeyGetSet<T> {
                set(v: T): void;
                get(): T;
            }
            interface TeamAvatarCellController {
                update(cardid?: Core.CardIdOrStringType, mezame?: Core.MezameType): void;
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
            interface TeamGemListItemController {
                onDelete?: () => void; // in

                setGemColor(gemColor: string): void;
                setName(name: string): void;
                setTooltip(tooltip: string): void;
                setSlot(slot: number): void;
                getSlot(): number;
                setId(id: number | string): void;
                getId(): number | string;
            }
            interface TeamNormalGemListItemController extends TeamGemListItemController {
                resetAttribute(attribute?: Core.AttributeType): void;
                resetMetaId(metaId: Internal.NormalGemCategoryIdType): void;
            }
            interface TeamLAGemListItemController extends TeamGemListItemController {
                resetGemId(gemId: Core.SisIdType): void;
            }
            interface TeamGemListController {
                getCount(): number;
                getItemController(itemIndex: number): TeamGemListItemController;
                getTotalSlot(): number;
                /** callback return true to break loop */
                forEachItemController(callback: (itemController: TeamGemListItemController, itemIndex: number) => boolean): void;
                mapItemController<T>(callback: (itemController: TeamGemListItemController, itemIndex: number) => T): T[];
                addListItem(element: HTMLElement, itemController: TeamGemListItemController): void;
                /** return true if remove success */
                removeListItemByIndex(itemIndex: number): boolean;
                /** return true if remove success */
                removeListItemByController(itemController: TeamGemListItemController): boolean;
                hasListItemId(itemId: number): boolean;
            }
            interface TeamNormalGemListController extends TeamGemListController, TeamMemberKeyGetSet<Internal.NormalGemCategoryKeyType[]> {
                onListChange?: (position: number, slots: number) => void;

                setAttributes(memberAttribute?: Core.AttributeType, mapAttribute?: Core.AttributeType): void;
                add(normalGemMetaKey: Internal.NormalGemCategoryKeyType): void;
            }
            interface TeamLAGemListController extends TeamGemListController, TeamMemberKeyGetSet<Core.SisIdType[]> {
                onListChange?: (position: number, slots: number) => void;

                add(gemId: Core.SisIdType): void;
            }
            interface LLTeamComponent_Options {
                onPutCardClicked?: (i: IndexType) => void;
                onPutGemClicked?: (i: IndexType) => Internal.NormalGemCategoryKeyType;
                onPutAccessoryClicked?: (i: IndexType) => Internal.AccessorySaveDataType;
                onCenterChanged?: () => void;

                mode?: LayoutMode;
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

                override serialize(): number;
                override deserialize(data: number): void;
                override saveJson(): string;
                override loadJson(jsonData?: string): void;
            }
        }
        namespace ScoreDistParam {
            type ScoreDistType = 'no' | 'v1' | Internal.SimulateMode;
            interface ScoreDistParamSaveData {
                type: ScoreDistType;
                /** int, simulate count */
                count: number;
                /** float 0~100 */
                perfect_percent: number;
                /** speed int 1~10 */
                speed: number;
                combo_fever_pattern: Core.ComboFeverPattern;
                combo_fever_limit: 1000 | 2147483647;
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
            interface LLScoreDistributionParameter_Options {
                mode?: LayoutMode;
            }
            class LLScoreDistributionParameter implements Mixin.SaveLoadJson {
                constructor(id: Component.HTMLElementOrId, options?: LLScoreDistributionParameter_Options);

                saveData(): ScoreDistParamSaveData;
                loadData(data: ScoreDistParamSaveData): void;
                
                // implements
                saveJson(): string;
                loadJson(jsonData: string): void;
            }
        }
        namespace UnitResult {
            interface LLUnitResultComponent_ResultController {
                update(team: Model.LLTeam): void;
                updateError(err: any): void;
            }
            class LLUnitResultComponent {
                constructor(id: Component.HTMLElementOrId);

                showResult(team: Model.LLTeam): void;
                showError(errorMessage: string): void;
                hideError(): void;
            }
        }

        namespace GemStock {
            class LLGemStockComponent implements Mixin.SaveLoadJson {
                constructor (id: Component.HTMLElementOrId);

                saveData(): any;
                loadData(data: any): void;

                // implements
                saveJson(): string;
                loadJson(jsonData?: string): void;
            }
        }

        namespace SubMember {
            interface LLSubMemberComponent_MemberContainerController {
                getMember(): Internal.SubMemberSaveDataType;
                setMember(member: Internal.SubMemberSaveDataType): void;
                startSwapping(): Internal.SubMemberSaveDataType;
                finishSwapping(member: Internal.SubMemberSaveDataType): Internal.SubMemberSaveDataType;

                removeElement(): void;
                onDelete?: () => void;
                onSwap?: () => void;
            }

            type LLSubMemberComponent_OnCountChangeCallback = (count: number) => void;

            class LLSubMemberComponent implements Mixin.SaveLoadJson {
                constructor (id: Component.HTMLElementOrId);

                onCountChange?: LLSubMemberComponent_OnCountChangeCallback;

                add(member: Internal.SubMemberSaveDataType, skipCountChange: boolean): void;
                remove(start: number, n: number): void;
                count(): number;
                empty(): boolean;
                setSwapper(swapper: TODO.LLSwapper): void;
                setOnCountChange(callback: LLSubMemberComponent_OnCountChangeCallback): void;

                saveData(): Internal.SubMemberSaveDataType[];
                loadData(data: Internal.SubMemberSaveDataType[]): void;

                // implements
                saveJson(): string;
                loadJson(jsonData?: string): void;
            }
        }

        namespace CenterSkill {
            interface LLCSkillComponent_Options {
                editable?: boolean;
                /** default '主唱技能' */
                title?: string;
            }

            interface LLCSkillComponent_Controller {
                setCSkill(card: Internal.CSkillDataType): void;
                getCSkill(): Internal.CSkillDataType;
                setMapColor(color: Core.AttributeType): void;
            }

            class LLCSkillComponent {
                constructor(id: Component.HTMLElementOrId, options?: LLCSkillComponent_Options);

                controller: LLCSkillComponent_Controller;

                setCSkill(card: Internal.CSkillDataType): void;
                getCSkill(): Internal.CSkillDataType;
                setMapColor(color: Core.AttributeType): void;
            }
        }

        namespace Skill {
            interface LLSkillContainer_Options {
                /** default 'skillcontainer' */
                container?: string;
                /** default 'skilllvup' */
                lvup?: string;
                /** default 'skilllvdown' */
                lvdown?: string;
                /** default 'skilllevel' */
                level?: string;
                /** default 'skilltext' */
                text?: string;
                showall?: boolean;
                cardData?: API.CardDataType;
            }
            class LLSkillContainer extends Component.LLComponentCollection {
                constructor(options?: LLSkillContainer_Options)

                /** base 0, 0~7/0~15 */
                skillLevel: number;
                showAll: boolean;
                cardData?: API.CardDataType;

                setSkillLevel(lv: number): void;
                setCardData(cardData?: API.CardDataType, skipRender?: boolean): void;
                render(): void;
            }
        }
    }

    class LLData<DataT> {
        constructor(brief_url: string, detail_url: string, brief_keys: string[], version?: string);

        briefKeys: string[];

        getAllBriefData(keys?: string[], url?: string): Depends.Promise<{[id: string]: DataT}, void>;
        getDetailedData(index: string, url?: string): Depends.Promise<DataT, void>;
        getAllCachedBriefData(): {[id: string]: DataT};
        getCachedDetailedData(index: string): DataT;

        setVersion(version?: string): void;
        getVersion(): string;
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
        GemType: ConstUtil.GemType;
        Accessory: ConstUtil.Accessory;
        Album: ConstUtil.Album;
        Common: ConstUtil.Common;
        Skill: ConstUtil.Skill;
        Attributes: ConstUtil.Attributes;
        Live: ConstUtil.Live;
        Song: ConstUtil.Song;
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
            accessoryIds?: Core.AccessoryIdStringType[];
            logData?: any;
            maxDiff?: number;
            successResult?: string;
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
            page: 'llnewunit' | 'llnewunitsis' | 'llnewautounit' | 'llnewunitla';
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
    }
}

declare var LLCardData: LLH.LLData<LLH.API.CardDataType>;
declare var LLSongData: LLH.LLData<LLH.API.SongDataType>;
declare var LLSisData: LLH.LLData<LLH.API.SisDataType>;
declare var LLAccessoryData: LLH.LLData<LLH.API.AccessoryDataType>;
declare var LLMetaData: LLH.LLSimpleKeyData<LLH.API.MetaDataType>;

declare var LLDepends: LLH.Depends.Utils;

type LLMapNoteData = LLH.Misc.LLMapNoteData;
type LLMap = LLH.Model.LLMap;

type LLComponentBase = LLH.Component.LLComponentBase;
type LLValuedComponent = LLH.Component.LLValuedComponent;
type LLValuedMemoryComponent = LLH.Component.LLValuedMemoryComponent;
type LLSelectComponent = LLH.Component.LLSelectComponent;
type LLImageComponent = LLH.Component.LLImageComponent;
type LLLanguageComponent = LLH.Layout.Language.LLLanguageComponent;
type LLAccessoryComponent = LLH.Component.LLAccessoryComponent;

type LLComponentCollection = LLH.Component.LLComponentCollection;
type LLFiltersComponent = LLH.Component.LLFiltersComponent;
type LLSkillContainer = LLH.Layout.Skill.LLSkillContainer;

type LLCardSelectorComponent = LLH.Selector.LLCardSelectorComponent;
type LLSongSelectorComponent = LLH.Selector.LLSongSelectorComponent;
type LLGemSelectorComponent = LLH.Selector.LLGemSelectorComponent;
type LLAccessorySelectorComponent = LLH.Selector.LLAccessorySelectorComponent;

type LLCSkillComponent = LLH.Layout.CenterSkill.LLCSkillComponent;
