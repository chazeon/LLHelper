declare namespace LLH {
    namespace Core {
        type AttributeType = 'smile'|'pure'|'cool';
        type AttributeAllType = AttributeType | 'all';
        /** 1 for smile, 2 for pure, 3 for cool */
        type AttributeIdType = 1|2|3;
        type GradeType = 1|2|3;
        /** 1 for muse, 2 for aqours, 3 for niji, 4 for liella */
        type SongGroupIdType = 1|2|3|4;

        type UnitTypeIdType = number;
        type MemberTagIdType = number;
        type AlbumIdType = number;
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
            color?: 1 | 2 | 3; // 1 for smile, 2 for pure, 3 for cool
            member?: number; // member id
            grade?: Core.GradeType;
            group?: number;
            trigger_ref?: number;
            trigger_value?: number;
            sub_skill?: number; // sub sis id
            live_effect_type?: number;
            live_effect_interval?: number;
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
        // TODO
    }

}

declare var LLCardData: LLH.LLData<LLH.API.CardDataType>;
declare var LLSongData: LLH.LLData<LLH.API.SongDataType>;
declare var LLSisData: LLH.LLData<LLH.API.SisDataType>;
declare var LLMetaData: LLH.LLSimpleKeyData<LLH.API.MetaDataType>;

declare var LLDepends: LLH.Depends.Utils;
