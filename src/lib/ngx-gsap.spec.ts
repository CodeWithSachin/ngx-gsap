import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxGsap } from './ngx-gsap';

describe('NgxGsap', () => {
  let component: NgxGsap;
  let fixture: ComponentFixture<NgxGsap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxGsap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxGsap);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
