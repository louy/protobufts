import * as ProtoBuf from 'protobufjs';

export function protoStringToTsDeclaration(proto: string): string {
  const json = protoStringToJson(proto);
  return protoJsonToTsDeclaration(json);
}

function protoJsonToTsDeclaration(proto: ProtoBuf.MetaProto): string {
  let ts = '';

  ts += proto.messages.map(message => messageToTs(message, proto)).join('\n');

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

function messageToTs(message: ProtoBuf.ProtoMessage, parent) {
  let ts = `export interface ${message.name} {\n`;
  for (const field of message.fields) {
    ts += `  ${fieldToTs(field, message, parent)}\n`;
  }
  ts += `}\n`;

  if (
    (message.enums && message.enums.length) ||
    (message.messages && message.messages.length)
  ) {
    ts += `export namespace ${message.name} {\n`
    ts += indent(message.enums.map(eNum => enumToTs(eNum, message)).join('\n'), 2);
    ts += indent(message.messages.map(child => messageToTs(child, message)).join('\n'), 2);
    ts += `}\n`
  }

  return ts;
}

function fieldToTs(field: ProtoBuf.ProtoField, message: ProtoBuf.ProtoMessage, parent?) {
  let type = '';

  switch (field.type) {
    case 'int32':
      type = 'number';
      break;
    case 'string':
      type = 'string';
      break;
    default: {
      const typeParts = field.type.split('.');
      const lastPart = typeParts.splice(typeParts.length - 1, 1)[0];
      const parentTypeMessage = typeParts
        .reduce((message, part) => {
          if (!message) return message;
          return message.messages.filter(message => message.name === part)[0];
        }, parent);
      const typeMessage = typeParts
        .reduce((message, part) => {
          if (!message) return message;
          return message.messages.filter(message => message.name === part)[0];
        }, message);

      if (
        typeMessage && (
          (typeMessage.enums as any[])
            .filter(eNum => eNum.name === lastPart)
            .length
          ||
          (typeMessage.messages as any[])
            .filter(message => message.name === lastPart)
            .length
        )
      ) {
        type = `${message.name}.${field.type}`;
        break;
      } else if (
        parentTypeMessage && (
          (parentTypeMessage.enums as any[])
            .filter(eNum => eNum.name === lastPart)
            .length
          ||
          (parentTypeMessage.messages as any[])
            .filter(message => message.name === lastPart)
            .length
        )
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
