import { MyInfoPersonAttributes } from './Constant';
import { MyInfoPersonApiResData, MyInfoPersonData, MyInfoPersonKey } from './Types';

export class MyInfoPerson {
  private person: MyInfoPersonData = {};

  constructor(data: MyInfoPersonApiResData) {
    for (const key in data) {
      const personKey = Object.keys(MyInfoPersonAttributes)[
        Object.values(MyInfoPersonAttributes).indexOf(key as MyInfoPersonAttributes)
      ] as MyInfoPersonKey;

      if (personKey) {
        if (personKey === 'mobileNumber') {
          const { prefix, areacode, nbr } = data[key];
          this.person[personKey] = {
            prefix,
            areaCode: areacode,
            value: nbr
          };
        } else if (personKey === 'adddress') {
          const { block, building, floor, unit, street, postal, country } = data[key];
          this.person[personKey] = {
            country: {
              code: country.code,
              value: country.desc
            },
            block: block.value,
            building: building.value,
            floorNumber: floor.value,
            unitNumber: unit.value,
            street: street.value,
            postalCode: postal.value
          };
        } else if (personKey === 'drivingLicence') {
          const { qdl } = data[key];
          const classes = qdl.classes.map((classObj: { class: { value: string }; issuedate: { value: string } }) => ({
            value: classObj.class.value,
            issueDate: classObj.issuedate.value
          }));

          this.person[personKey] = {
            validity: {
              code: qdl.validity.code,
              value: qdl.validity.desc
            },
            expiryDate: qdl.expirydate,
            classes
          };
        } else {
          const { code, desc, value } = data[key];
          const valueToUse = desc ?? value;
          this.person[personKey] = {
            code: code?.length > 0 ? code : undefined,
            value: valueToUse.length > 0 ? valueToUse : undefined
          };
        }

        const result = this.person[personKey];
        if (
          result &&
          (Object.keys(result).length === 0 || Object.values(result).every((value) => value === undefined))
        ) {
          this.person[personKey] = undefined;
        }
      }
    }
  }

  transform(): MyInfoPersonData {
    return this.person;
  }
}
