import * as ProtoBuf from 'protobufjs';

export function protoStringToTsDeclaration(proto: string): string {
  const json = protoStringToJson(proto);
  // FIXME - support imports
  return protoJsonToTsDeclaration(json);
}

function protoJsonToTsDeclaration(proto: ProtoBuf.MetaProto): string {
  let ts = '';

  ts += [
    ...proto.enums.map(eNum => enumToTs(eNum, proto)),
    ...proto.messages.map(message => messageToTs(message, [proto])),
  ].join('\n');

  if (proto.package) {
    ts = `export namespace ${proto.package} {\n${indent(ts, 2)}}\n`;
  }

  return ts;
}

export function protoStringToTs(proto: string): string {
  const json = protoStringToJson(proto);
  const declaration = protoJsonToTsDeclaration(json);

  return `${declaration}
export const json = ${JSON.stringify(json)};
import Protobuf = require('protobufjs');
export default Protobuf.newBuilder({
  convertFieldsToCamelCase: true,
  populateAccessors: false,
})['import'](json);
`;
}

export function protoStringToJson(proto: string): ProtoBuf.MetaProto {
  return (ProtoBuf.DotProto.Parser.parse as any)(proto);
}

function messageToTs(message: ProtoBuf.ProtoMessage, parents: (ProtoBuf.ProtoMessage | ProtoBuf.MetaProto)[] = []) {
  let ts = `export interface ${message.name} {\n`;
  for (const field of message.fields) {
    ts += `  ${fieldToTs(field, message, parents)}\n`;
  }
  ts += `}\n`;

  if (
    (message.enums && message.enums.length) ||
    (message.messages && message.messages.length)
  ) {
    ts += `export namespace ${message.name} {\n`
    ts += indent(message.enums.map(eNum => enumToTs(eNum, message)).join('\n'), 2);
    ts += indent(message.messages.map(child => messageToTs(child, [message, ...parents])).join('\n'), 2);
    ts += `}\n`
  }

  return ts;
}

function isValidFieldType(type: string, message: ProtoBuf.ProtoMessage | ProtoBuf.MetaProto): boolean {
  const typeParts = type.split('.');
  const lastPart = typeParts.splice(typeParts.length - 1, 1)[0];
  let typeMessage = typeParts
    .reduce((message, part) => {
      if (!message) return message;
      return message.messages.filter(message => message.name === part)[0];
    }, message);

  if (!typeMessage) {
    if (
      (message as ProtoBuf.MetaProto).package &&
      (message as ProtoBuf.MetaProto).package === typeParts[0]
    ) {
      typeParts.splice(0, 1);
      typeMessage = typeParts
        .reduce((message, part) => {
          if (!message) return message;
          return message.messages.filter(message => message.name === part)[0];
        }, message);
    }
  }

  if (!typeMessage) {
    return false;
  }

  return !!(
    (typeMessage.enums as any[])
      .filter(eNum => eNum.name === lastPart)
      .length
    ||
    (typeMessage.messages as any[])
      .filter(message => message.name === lastPart)
      .length
  );
}

function fieldToTs(field: ProtoBuf.ProtoField, message: ProtoBuf.ProtoMessage, parents: (ProtoBuf.ProtoMessage | ProtoBuf.MetaProto)[] = []) {
  let type = '';

  switch (field.type) {
    case 'int32':
    case 'uint32':
      type = 'number';
      break;
    case 'string':
      type = 'string';
      break;
    default: {
      if (
        isValidFieldType(field.type, message)
      ) {
        type = `${message.name}.${field.type}`;
        break;
      } else if (
        parents.some(parent => isValidFieldType(field.type, parent))
      ) {
        type = `${field.type}`;
        break;
      } else {
        throw new Error(`Unknown field type: ${field.type}`);
      }
    }
  }

  let ts = `${field.name}`;

  switch (field.rule) {
    case 'optional':
      ts += `?: ${type}`;
      break;
    case 'required':
      ts += `: ${type}`;
      break;
    case 'repeated':
      ts += `: ${type}[]`;
      break;
    default:
      throw new Error(`Unknown field rule: ${field.rule}`);
  }

  ts += ';';

  return ts;
}

function enumToTs(eNum: ProtoBuf.ProtoEnum, message) {
  return `export enum ${eNum.name} {\n${
    eNum.values.map(value =>
      `  ${value.name} = ${value.id},`
    ).join('\n')
  }\n}\n`;
}

function indent(string: string, spaces: number) {
  let indentation = Array.apply(null, new Array(spaces)).map(x => ' ').join('');

  return string
    .split('\n')
    .map(line => line ? `${indentation}${line}` : '')
    .join('\n');
}
